import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  getStudentDailyReports,
  getStudentPlacement,
  submitStudentDailyReport,
} from '../api/student';
import DataCard from '../components/DataCard';
import InfoStateCard from '../components/InfoStateCard';
import KeyValueRow from '../components/KeyValueRow';
import LoadMoreButton from '../components/LoadMoreButton';
import StatusBadge from '../components/StatusBadge';
import StudentScreenLayout from '../components/StudentScreenLayout';
import { usePaginatedResource } from '../hooks/usePaginatedResource';
import { appTheme } from '../theme';
import type { Placement } from '../types/student';
import { getApiErrorMessage, getApiValidationErrors } from '../utils/errors';
import { formatDate, formatDateTime, formatHours } from '../utils/formatters';
import { getTodayIsoDate, isValidIsoDate, parsePositiveNumber } from '../utils/validation';

type DailyReportFormErrors = Partial<
  Record<'placement_id' | 'work_date' | 'accomplishments' | 'hours_rendered', string>
>;

export default function DailyReportsScreen() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [isPlacementLoading, setIsPlacementLoading] = useState(true);
  const [isPlacementRefreshing, setIsPlacementRefreshing] = useState(false);

  const [workDateInput, setWorkDateInput] = useState(getTodayIsoDate());
  const [accomplishmentsInput, setAccomplishmentsInput] = useState('');
  const [hoursRenderedInput, setHoursRenderedInput] = useState('');
  const [formErrors, setFormErrors] = useState<DailyReportFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    items: reports,
    error,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    refresh,
    reload,
    loadMore,
  } = usePaginatedResource(getStudentDailyReports, {
    perPage: 10,
    sort: 'work_date',
    direction: 'desc',
  });

  const loadPlacement = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setIsPlacementRefreshing(true);
    } else {
      setIsPlacementLoading(true);
    }

    setPlacementError(null);

    try {
      const currentPlacement = await getStudentPlacement();
      setPlacement(currentPlacement);
    } catch (placementLoadError) {
      setPlacementError(getApiErrorMessage(placementLoadError, 'Unable to load current placement.'));
    } finally {
      setIsPlacementLoading(false);
      setIsPlacementRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPlacement('initial');
  }, [loadPlacement]);

  const refreshAll = useCallback(() => {
    refresh();
    void loadPlacement('refresh');
  }, [loadPlacement, refresh]);

  const reloadAll = useCallback(() => {
    reload();
    void loadPlacement('initial');
  }, [loadPlacement, reload]);

  const handleSubmit = useCallback(async () => {
    const nextErrors: DailyReportFormErrors = {};
    const placementId = placement?.id ?? null;
    const workDate = workDateInput.trim();
    const accomplishments = accomplishmentsInput.trim();
    const hoursRendered = parsePositiveNumber(hoursRenderedInput);

    if (!placementId) {
      nextErrors.placement_id = 'A placement is required before submitting reports.';
    }

    if (!isValidIsoDate(workDate)) {
      nextErrors.work_date = 'Use YYYY-MM-DD format for work date.';
    }

    if (accomplishments.length < 10) {
      nextErrors.accomplishments = 'Accomplishments must be at least 10 characters.';
    }

    if (hoursRendered === null) {
      nextErrors.hours_rendered = 'Enter valid rendered hours (example: 8 or 7.5).';
    } else if (hoursRendered < 0.25 || hoursRendered > 24) {
      nextErrors.hours_rendered = 'Hours rendered must be between 0.25 and 24.';
    }

    setFormErrors(nextErrors);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (Object.keys(nextErrors).length > 0 || !placementId || hoursRendered === null) {
      setSubmitError('Please review the highlighted fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitStudentDailyReport({
        placement_id: placementId,
        work_date: workDate,
        accomplishments,
        hours_rendered: hoursRendered,
      });

      setSubmitSuccess('Daily report submitted successfully.');
      setAccomplishmentsInput('');
      setHoursRenderedInput('');
      setFormErrors({});
      reload();
    } catch (submissionError) {
      const apiValidationErrors = getApiValidationErrors(submissionError);
      setFormErrors({
        placement_id: apiValidationErrors.placement_id?.[0],
        work_date: apiValidationErrors.work_date?.[0],
        accomplishments: apiValidationErrors.accomplishments?.[0],
        hours_rendered: apiValidationErrors.hours_rendered?.[0],
      });
      setSubmitError(getApiErrorMessage(submissionError, 'Unable to submit daily report right now.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [accomplishmentsInput, hoursRenderedInput, placement?.id, reload, workDateInput]);

  return (
    <StudentScreenLayout
      title="Daily Reports"
      subtitle="Submit and review your day-to-day work history."
      refreshing={isRefreshing || isPlacementRefreshing}
      onRefresh={refreshAll}
    >
      <DataCard title="Submit daily report">
        {isPlacementLoading ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color={appTheme.colors.primary} />
            <Text style={styles.placeholderText}>Loading current placement...</Text>
          </View>
        ) : (
          <KeyValueRow
            label="Current Placement"
            value={placement?.company?.name ?? 'No placement available'}
          />
        )}

        {formErrors.placement_id ? <Text style={styles.fieldError}>{formErrors.placement_id}</Text> : null}
        {placementError ? <Text style={styles.errorText}>{placementError}</Text> : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Work Date *</Text>
          <TextInput
            editable={!isSubmitting}
            placeholder="YYYY-MM-DD"
            style={styles.input}
            value={workDateInput}
            onChangeText={(value) => {
              setWorkDateInput(value);
              setFormErrors((current) => ({ ...current, work_date: undefined }));
            }}
          />
          {formErrors.work_date ? <Text style={styles.fieldError}>{formErrors.work_date}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Accomplishments *</Text>
          <TextInput
            editable={!isSubmitting}
            multiline
            numberOfLines={4}
            placeholder="Describe what you completed today."
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={accomplishmentsInput}
            onChangeText={(value) => {
              setAccomplishmentsInput(value);
              setFormErrors((current) => ({ ...current, accomplishments: undefined }));
            }}
          />
          {formErrors.accomplishments ? <Text style={styles.fieldError}>{formErrors.accomplishments}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Hours Rendered *</Text>
          <TextInput
            editable={!isSubmitting}
            keyboardType="decimal-pad"
            placeholder="e.g. 8"
            style={styles.input}
            value={hoursRenderedInput}
            onChangeText={(value) => {
              setHoursRenderedInput(value);
              setFormErrors((current) => ({ ...current, hours_rendered: undefined }));
            }}
          />
          {formErrors.hours_rendered ? <Text style={styles.fieldError}>{formErrors.hours_rendered}</Text> : null}
        </View>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
        {submitSuccess ? <Text style={styles.successText}>{submitSuccess}</Text> : null}

        <Button
          title={isSubmitting ? 'Submitting report...' : 'Submit daily report'}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting || isPlacementLoading || !placement}
        />
      </DataCard>

      {isLoading && reports.length === 0 ? (
        <DataCard>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.placeholderText}>Loading daily reports...</Text>
        </DataCard>
      ) : null}

      {!isLoading && error && reports.length === 0 ? (
        <InfoStateCard
          tone="error"
          title="Unable to load daily reports"
          message={error}
          actionLabel="Retry"
          onActionPress={reloadAll}
        />
      ) : null}

      {!isLoading && !error && reports.length === 0 ? (
        <InfoStateCard
          title="No daily reports found"
          message="Once submitted, daily reports will appear here with their latest review status."
        />
      ) : null}

      {reports.length > 0 ? (
        <>
          {error ? (
            <InfoStateCard
              tone="error"
              title="Unable to refresh daily reports"
              message={error}
              actionLabel="Retry"
              onActionPress={reloadAll}
            />
          ) : null}

          {reports.map((report) => {
            const isExpanded = expandedId === report.id;

            return (
              <DataCard
                key={report.id}
                onPress={() => {
                  setExpandedId((current) => (current === report.id ? null : report.id));
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{formatDate(report.work_date)}</Text>
                  <StatusBadge status={report.status} />
                </View>

                <KeyValueRow label="Company" value={report.placement?.company?.name ?? 'N/A'} />
                <KeyValueRow label="Hours Rendered" value={formatHours(report.hours_rendered)} />
                <Text style={styles.expandHint}>
                  {isExpanded ? 'Tap to hide details' : 'Tap to view details'}
                </Text>

                {isExpanded ? (
                  <View style={styles.details}>
                    <Text style={styles.detailLabel}>Accomplishments</Text>
                    <Text style={styles.detailValue}>{report.accomplishments}</Text>
                    <KeyValueRow label="Reviewer" value={report.reviewer?.name ?? 'Pending'} />
                    <Text style={styles.detailLabel}>Reviewer Comment</Text>
                    <Text style={styles.detailValue}>
                      {report.reviewer_comment && report.reviewer_comment.length > 0
                        ? report.reviewer_comment
                        : 'No reviewer comment yet.'}
                    </Text>
                    <KeyValueRow label="Submitted At" value={formatDateTime(report.created_at)} />
                  </View>
                ) : null}
              </DataCard>
            );
          })}

          {hasMore ? (
            <LoadMoreButton isLoading={isLoadingMore} onPress={loadMore} disabled={isRefreshing} />
          ) : null}
        </>
      ) : null}
    </StudentScreenLayout>
  );
}

const styles = StyleSheet.create({
  placeholderText: {
    fontSize: 14,
    color: appTheme.colors.mutedText,
    lineHeight: 20,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
  },
  fieldGroup: {
    gap: appTheme.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 8,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: appTheme.colors.surface,
    color: appTheme.colors.text,
  },
  textArea: {
    minHeight: 110,
  },
  fieldError: {
    color: '#B91C1C',
    fontSize: 12,
  },
  errorText: {
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: appTheme.spacing.sm,
  },
  successText: {
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: appTheme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.colors.text,
  },
  expandHint: {
    color: appTheme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    marginTop: appTheme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    paddingTop: appTheme.spacing.sm,
    gap: appTheme.spacing.xs,
  },
  detailLabel: {
    fontSize: 13,
    color: appTheme.colors.mutedText,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: appTheme.colors.text,
    lineHeight: 20,
  },
});
