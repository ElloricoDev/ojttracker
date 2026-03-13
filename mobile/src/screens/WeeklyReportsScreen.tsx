import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  getStudentPlacement,
  getStudentWeeklyReports,
  submitStudentWeeklyReport,
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

type WeeklyReportFormErrors = Partial<
  Record<'placement_id' | 'week_start' | 'week_end' | 'accomplishments' | 'hours_rendered', string>
>;

export default function WeeklyReportsScreen() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [isPlacementLoading, setIsPlacementLoading] = useState(true);
  const [isPlacementRefreshing, setIsPlacementRefreshing] = useState(false);

  const [weekStartInput, setWeekStartInput] = useState(getTodayIsoDate());
  const [weekEndInput, setWeekEndInput] = useState(getTodayIsoDate());
  const [accomplishmentsInput, setAccomplishmentsInput] = useState('');
  const [hoursRenderedInput, setHoursRenderedInput] = useState('');
  const [formErrors, setFormErrors] = useState<WeeklyReportFormErrors>({});
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
  } = usePaginatedResource(getStudentWeeklyReports, {
    perPage: 10,
    sort: 'week_start',
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
    const nextErrors: WeeklyReportFormErrors = {};
    const placementId = placement?.id ?? null;
    const weekStart = weekStartInput.trim();
    const weekEnd = weekEndInput.trim();
    const accomplishments = accomplishmentsInput.trim();
    const hoursRendered = parsePositiveNumber(hoursRenderedInput);

    if (!placementId) {
      nextErrors.placement_id = 'A placement is required before submitting reports.';
    }

    if (!isValidIsoDate(weekStart)) {
      nextErrors.week_start = 'Use YYYY-MM-DD format for week start.';
    }

    if (!isValidIsoDate(weekEnd)) {
      nextErrors.week_end = 'Use YYYY-MM-DD format for week end.';
    }

    if (isValidIsoDate(weekStart) && isValidIsoDate(weekEnd) && weekEnd < weekStart) {
      nextErrors.week_end = 'Week end cannot be earlier than week start.';
    }

    if (accomplishments.length < 10) {
      nextErrors.accomplishments = 'Accomplishments must be at least 10 characters.';
    }

    if (hoursRendered === null) {
      nextErrors.hours_rendered = 'Enter valid rendered hours (example: 40).';
    } else if (hoursRendered < 0.25 || hoursRendered > 168) {
      nextErrors.hours_rendered = 'Hours rendered must be between 0.25 and 168.';
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
      await submitStudentWeeklyReport({
        placement_id: placementId,
        week_start: weekStart,
        week_end: weekEnd,
        accomplishments,
        hours_rendered: hoursRendered,
      });

      setSubmitSuccess('Weekly report submitted successfully.');
      setAccomplishmentsInput('');
      setHoursRenderedInput('');
      setFormErrors({});
      reload();
    } catch (submissionError) {
      const apiValidationErrors = getApiValidationErrors(submissionError);
      setFormErrors({
        placement_id: apiValidationErrors.placement_id?.[0],
        week_start: apiValidationErrors.week_start?.[0],
        week_end: apiValidationErrors.week_end?.[0],
        accomplishments: apiValidationErrors.accomplishments?.[0],
        hours_rendered: apiValidationErrors.hours_rendered?.[0],
      });
      setSubmitError(getApiErrorMessage(submissionError, 'Unable to submit weekly report right now.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    accomplishmentsInput,
    hoursRenderedInput,
    placement?.id,
    reload,
    weekEndInput,
    weekStartInput,
  ]);

  return (
    <StudentScreenLayout
      title="Weekly Reports"
      subtitle="Submit weekly summaries and review feedback."
      refreshing={isRefreshing || isPlacementRefreshing}
      onRefresh={refreshAll}
    >
      <DataCard title="Submit weekly report">
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

        <View style={styles.fieldRow}>
          <View style={styles.fieldColumn}>
            <Text style={styles.label}>Week Start *</Text>
            <TextInput
              editable={!isSubmitting}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              value={weekStartInput}
              onChangeText={(value) => {
                setWeekStartInput(value);
                setFormErrors((current) => ({ ...current, week_start: undefined }));
              }}
            />
            {formErrors.week_start ? <Text style={styles.fieldError}>{formErrors.week_start}</Text> : null}
          </View>

          <View style={styles.fieldColumn}>
            <Text style={styles.label}>Week End *</Text>
            <TextInput
              editable={!isSubmitting}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              value={weekEndInput}
              onChangeText={(value) => {
                setWeekEndInput(value);
                setFormErrors((current) => ({ ...current, week_end: undefined }));
              }}
            />
            {formErrors.week_end ? <Text style={styles.fieldError}>{formErrors.week_end}</Text> : null}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Accomplishments *</Text>
          <TextInput
            editable={!isSubmitting}
            multiline
            numberOfLines={4}
            placeholder="Summarize your accomplishments for the week."
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
            placeholder="e.g. 40"
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
          title={isSubmitting ? 'Submitting report...' : 'Submit weekly report'}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting || isPlacementLoading || !placement}
        />
      </DataCard>

      {isLoading && reports.length === 0 ? (
        <DataCard>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.placeholderText}>Loading weekly reports...</Text>
        </DataCard>
      ) : null}

      {!isLoading && error && reports.length === 0 ? (
        <InfoStateCard
          tone="error"
          title="Unable to load weekly reports"
          message={error}
          actionLabel="Retry"
          onActionPress={reloadAll}
        />
      ) : null}

      {!isLoading && !error && reports.length === 0 ? (
        <InfoStateCard
          title="No weekly reports found"
          message="Weekly reports will appear here after submission."
        />
      ) : null}

      {reports.length > 0 ? (
        <>
          {error ? (
            <InfoStateCard
              tone="error"
              title="Unable to refresh weekly reports"
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
                  <Text style={styles.cardTitle}>
                    {formatDate(report.week_start)} - {formatDate(report.week_end)}
                  </Text>
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
  fieldRow: {
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
  },
  fieldColumn: {
    flex: 1,
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
    flex: 1,
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
