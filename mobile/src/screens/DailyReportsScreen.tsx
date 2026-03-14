import { useCallback, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  getStudentDailyReports,
  submitStudentDailyReport,
} from '../api/student';
import DataCard from '../components/DataCard';
import InfoStateCard from '../components/InfoStateCard';
import KeyValueRow from '../components/KeyValueRow';
import LoadMoreButton from '../components/LoadMoreButton';
import StatusBadge from '../components/StatusBadge';
import StudentScreenLayout from '../components/StudentScreenLayout';
import { useToast } from '../components/ToastProvider';
import { usePaginatedResource } from '../hooks/usePaginatedResource';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';
import { useTheme } from '../theme/ThemeProvider';
import { getApiErrorMessage, getApiValidationErrors } from '../utils/errors';
import { formatDate, formatDateTime, formatHours } from '../utils/formatters';
import { getTodayIsoDate, isValidIsoDate, parsePositiveNumber } from '../utils/validation';
import { usePlacementSession } from '../stores/placementSession';

type DailyReportFormErrors = Partial<
  Record<'placement_id' | 'work_date' | 'accomplishments' | 'hours_rendered', string>
>;

export default function DailyReportsScreen() {
  const { s } = useResponsive();
  const { colors } = useTheme();
  const styles = getStyles(s, colors);
  const toast = useToast();
  const {
    placement,
    isLoading: isPlacementLoading,
    isRefreshing: isPlacementRefreshing,
    error: placementError,
    refresh: refreshPlacement,
  } = usePlacementSession();
  const [showWorkDatePicker, setShowWorkDatePicker] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  const refreshAll = useCallback(() => {
    refresh();
    void refreshPlacement();
  }, [refresh, refreshPlacement]);

  const reloadAll = useCallback(() => {
    reload();
    void refreshPlacement();
  }, [refreshPlacement, reload]);

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
      toast.show({ type: 'success', title: 'Submitted', message: 'Daily report submitted.' });
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
      const message = getApiErrorMessage(submissionError, 'Unable to submit daily report right now.');
      setSubmitError(message);
      toast.show({ type: 'error', title: 'Submission failed', message });
    } finally {
      setIsSubmitting(false);
    }
  }, [accomplishmentsInput, hoursRenderedInput, placement?.id, reload, workDateInput]);

  const parseIsoDate = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const formatIsoDate = (value: Date) => {
    const offset = value.getTimezoneOffset() * 60000;
    return new Date(value.getTime() - offset).toISOString().slice(0, 10);
  };

  return (
    <StudentScreenLayout
      title="Daily Reports"
      subtitle="Submit and review your day-to-day work history."
      headerIconName="notebook-edit-outline"
      refreshing={isRefreshing || isPlacementRefreshing}
      onRefresh={refreshAll}
    >
      <DataCard
        title="Submit daily report"
        subtitle="Capture what you accomplished today."
        icon={<MaterialCommunityIcons name="clipboard-check-outline" size={16} color="#1D4ED8" />}
      >
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
          <View style={styles.labelRow}>
            <View style={styles.labelIcon}>
              <MaterialCommunityIcons name="calendar-check-outline" size={14} color="#1D4ED8" />
            </View>
            <Text style={styles.label}>Work Date</Text>
            <Text style={styles.requiredTag}>Required</Text>
          </View>
          <Pressable
            onPress={() => {
              if (!isSubmitting) {
                setShowWorkDatePicker(true);
              }
            }}
            style={({ pressed }) => [
              styles.input,
              styles.dateInput,
              pressed && styles.inputPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Select work date"
          >
            <Text style={styles.dateValue}>
              {workDateInput ? formatDate(workDateInput, workDateInput) : 'Select date'}
            </Text>
            <MaterialCommunityIcons name="calendar-month-outline" size={16} color={styles.dateIcon.color as string} />
          </Pressable>
          {showWorkDatePicker ? (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={parseIsoDate(workDateInput)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowWorkDatePicker(false);
                  }
                  if (event.type === 'set' && selectedDate) {
                    setWorkDateInput(formatIsoDate(selectedDate));
                    setFormErrors((current) => ({ ...current, work_date: undefined }));
                  }
                  if (event.type === 'dismissed') {
                    setShowWorkDatePicker(false);
                  }
                }}
              />
              {Platform.OS === 'ios' ? (
                <Pressable
                  onPress={() => setShowWorkDatePicker(false)}
                  style={styles.pickerDone}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <Text style={styles.helperText}>Use ISO format so your report is easy to track.</Text>
          {formErrors.work_date ? <Text style={styles.fieldError}>{formErrors.work_date}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <View style={styles.labelIcon}>
              <MaterialCommunityIcons name="notebook-edit-outline" size={14} color="#0F766E" />
            </View>
            <Text style={styles.label}>Accomplishments</Text>
            <Text style={styles.requiredTag}>Required</Text>
          </View>
          <TextInput
            editable={!isSubmitting}
            multiline
            numberOfLines={4}
            placeholder="Describe what you completed today."
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            placeholderTextColor={appTheme.colors.subtleText}
            autoCapitalize="sentences"
            value={accomplishmentsInput}
            onChangeText={(value) => {
              setAccomplishmentsInput(value);
              setFormErrors((current) => ({ ...current, accomplishments: undefined }));
            }}
          />
          <Text style={styles.helperText}>Be specific about tasks, tools, or outputs.</Text>
          {formErrors.accomplishments ? <Text style={styles.fieldError}>{formErrors.accomplishments}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <View style={styles.labelIcon}>
              <MaterialCommunityIcons name="timer-outline" size={14} color="#B45309" />
            </View>
            <Text style={styles.label}>Hours Rendered</Text>
            <Text style={styles.requiredTag}>Required</Text>
          </View>
          <TextInput
            editable={!isSubmitting}
            keyboardType="decimal-pad"
            placeholder="e.g. 8"
            style={styles.input}
            placeholderTextColor={appTheme.colors.subtleText}
            value={hoursRenderedInput}
            onChangeText={(value) => {
              setHoursRenderedInput(value);
              setFormErrors((current) => ({ ...current, hours_rendered: undefined }));
            }}
          />
          <Text style={styles.helperText}>You can use decimals (example: 7.5).</Text>
          {formErrors.hours_rendered ? <Text style={styles.fieldError}>{formErrors.hours_rendered}</Text> : null}
        </View>


        <Pressable
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting || isPlacementLoading || !placement}
          style={({ pressed }) => [
            styles.submitButton,
            (isSubmitting || isPlacementLoading || !placement) && styles.submitButtonDisabled,
            pressed && !isSubmitting ? styles.submitButtonPressed : null,
          ]}
        >
          <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting report...' : 'Submit daily report'}
          </Text>
        </Pressable>
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

const getStyles = (s: (value: number) => number, colors: typeof appTheme.colors) =>
  StyleSheet.create({
    placeholderText: {
      fontSize: s(14),
      color: colors.mutedText,
      lineHeight: s(20),
    },
    helperText: {
      fontSize: s(12),
      color: colors.subtleText,
    },
    inlineLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(appTheme.spacing.sm),
    },
    fieldGroup: {
      gap: s(appTheme.spacing.xs),
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(appTheme.spacing.xs),
    },
    labelIcon: {
      width: s(22),
      height: s(22),
      borderRadius: s(8),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primaryRing,
    },
    label: {
      fontSize: s(14),
      fontWeight: '600',
      color: colors.text,
    },
    requiredTag: {
      fontSize: s(10),
      fontWeight: '700',
      color: colors.warningText,
      backgroundColor: colors.warningLight,
      paddingHorizontal: s(6),
      paddingVertical: 2,
      borderRadius: 999,
      overflow: 'hidden',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: s(10),
      paddingHorizontal: s(appTheme.spacing.md),
      paddingVertical: s(appTheme.spacing.sm),
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: s(14),
    },
    dateInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateValue: {
      fontSize: s(14),
      color: colors.text,
    },
    dateIcon: {
      color: colors.mutedText,
    },
    inputPressed: {
      borderColor: appTheme.colors.primary,
    },
    datePickerWrap: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: s(12),
      padding: s(appTheme.spacing.xs),
      backgroundColor: colors.surface,
    },
    pickerDone: {
      alignSelf: 'flex-end',
      marginTop: s(appTheme.spacing.xs),
      paddingHorizontal: s(appTheme.spacing.sm),
      paddingVertical: s(appTheme.spacing.xs),
      borderRadius: s(10),
      backgroundColor: '#1D4ED8',
    },
    pickerDoneText: {
      color: '#FFFFFF',
      fontSize: s(12),
      fontWeight: '600',
    },
    textArea: {
      minHeight: s(120),
    },
    fieldError: {
      color: '#B91C1C',
      fontSize: s(12),
    },
    errorText: {
      color: colors.errorText,
      backgroundColor: colors.errorLight,
      borderRadius: s(10),
      padding: s(appTheme.spacing.sm),
      fontSize: s(12),
    },
    successText: {
      color: colors.successText,
      backgroundColor: colors.successLight,
      borderRadius: s(10),
      padding: s(appTheme.spacing.sm),
      fontSize: s(12),
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(appTheme.spacing.xs),
      borderRadius: s(12),
      paddingVertical: s(appTheme.spacing.sm),
      backgroundColor: colors.primary,
    },
    submitButtonPressed: {
      opacity: 0.9,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: s(14),
      fontWeight: '600',
      color: colors.surface,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: s(appTheme.spacing.sm),
    },
    cardTitle: {
      fontSize: s(16),
      fontWeight: '700',
      color: colors.text,
    },
    expandHint: {
      color: colors.primary,
      fontSize: s(12),
      fontWeight: '600',
    },
    details: {
      marginTop: s(appTheme.spacing.xs),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: s(appTheme.spacing.sm),
      gap: s(appTheme.spacing.xs),
    },
    detailLabel: {
      fontSize: s(13),
      color: colors.mutedText,
      fontWeight: '600',
    },
    detailValue: {
      fontSize: s(13),
      color: colors.text,
      lineHeight: s(20),
    },
  });
