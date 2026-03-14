import { useCallback, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getStudentAttendance,
  submitStudentAttendanceTimeIn,
  submitStudentAttendanceTimeOut,
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
import { getApiErrorMessage } from '../utils/errors';
import { formatDate, formatDateTime, formatMinutes } from '../utils/formatters';
import { usePlacementSession } from '../stores/placementSession';

type AttendanceAction = 'time_in' | 'time_out';

export default function AttendanceScreen() {
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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [attendanceActionError, setAttendanceActionError] = useState<string | null>(null);
  const [attendanceActionSuccess, setAttendanceActionSuccess] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<AttendanceAction | null>(null);

  const {
    items: attendanceLogs,
    error,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    refresh,
    reload,
    loadMore,
  } = usePaginatedResource(getStudentAttendance, {
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

  const handleAttendanceAction = useCallback(
    async (action: AttendanceAction) => {
      if (!placement?.id || placement.status !== 'active') {
        setAttendanceActionError(
          'You need an existing placement before using attendance time in/out actions.'
        );
        setAttendanceActionSuccess(null);
        return;
      }

      setActiveAction(action);
      setAttendanceActionError(null);
      setAttendanceActionSuccess(null);

      try {
        if (action === 'time_in') {
          await submitStudentAttendanceTimeIn({ placement_id: placement.id });
          setAttendanceActionSuccess('Time in logged successfully.');
          toast.show({ type: 'success', title: 'Time in', message: 'Attendance recorded.' });
        } else {
          await submitStudentAttendanceTimeOut({ placement_id: placement.id });
          setAttendanceActionSuccess('Time out logged successfully.');
          toast.show({ type: 'success', title: 'Time out', message: 'Attendance recorded.' });
        }

        reload();
      } catch (actionError) {
        const message = getApiErrorMessage(actionError, 'Unable to submit attendance action right now.');
        setAttendanceActionError(message);
        toast.show({ type: 'error', title: 'Action failed', message });
      } finally {
        setActiveAction(null);
      }
    },
    [placement?.id, placement?.status, reload]
  );

  return (
    <StudentScreenLayout
      title="Attendance"
      subtitle="Daily attendance logs from your placement."
      headerIconName="calendar-check-outline"
      refreshing={isRefreshing || isPlacementRefreshing}
      onRefresh={refreshAll}
    >
      <DataCard
        title="Attendance actions"
        subtitle="Log your daily time-in and time-out."
        icon={<MaterialCommunityIcons name="calendar-check" size={16} color="#1D4ED8" />}
      >
        {isPlacementLoading ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color={appTheme.colors.primary} />
            <Text style={styles.placeholderText}>Loading current placement...</Text>
          </View>
        ) : !placement ? (
          <InfoStateCard
            tone="error"
            title="No placement found"
            message="Attendance logging is unavailable until your placement is assigned."
            actionLabel={placementError ? 'Retry placement load' : undefined}
            onActionPress={placementError ? () => void loadPlacement('initial') : undefined}
          />
        ) : (
          <View style={styles.actionBlock}>
            <KeyValueRow label="Current Placement" value={placement.company?.name ?? `#${placement.id}`} />
            <View style={styles.buttonGroup}>
              <Pressable
                onPress={() => {
                  void handleAttendanceAction('time_in');
                }}
                disabled={activeAction !== null}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.timeInButton,
                  pressed && styles.actionButtonPressed,
                  activeAction !== null && styles.actionButtonDisabled,
                ]}
              >
                {activeAction === 'time_in' ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <MaterialCommunityIcons name="login" size={16} color="#0F172A" />
                )}
                <Text style={styles.actionButtonText}>
                  {activeAction === 'time_in' ? 'Logging time in...' : 'Time In'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void handleAttendanceAction('time_out');
                }}
                disabled={activeAction !== null}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.timeOutButton,
                  pressed && styles.actionButtonPressed,
                  activeAction !== null && styles.actionButtonDisabled,
                ]}
              >
                {activeAction === 'time_out' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="logout" size={16} color="#fff" />
                )}
                <Text style={[styles.actionButtonText, styles.timeOutButtonText]}>
                  {activeAction === 'time_out' ? 'Logging time out...' : 'Time Out'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {placementError ? <Text style={styles.errorText}>{placementError}</Text> : null}
      </DataCard>

      {isLoading && attendanceLogs.length === 0 ? (
        <DataCard>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.placeholderText}>Loading attendance records...</Text>
        </DataCard>
      ) : null}

      {!isLoading && error && attendanceLogs.length === 0 ? (
        <InfoStateCard
          tone="error"
          title="Unable to load attendance"
          message={error}
          actionLabel="Retry"
          onActionPress={reloadAll}
        />
      ) : null}

      {!isLoading && !error && attendanceLogs.length === 0 ? (
        <InfoStateCard
          title="No attendance records yet"
          message="Attendance entries will appear here once your logs are available."
        />
      ) : null}

      {attendanceLogs.length > 0 ? (
        <>
          {error ? (
            <InfoStateCard
              tone="error"
              title="Unable to refresh attendance"
              message={error}
              actionLabel="Retry"
              onActionPress={reloadAll}
            />
          ) : null}

          {attendanceLogs.map((attendanceLog) => {
            const isExpanded = expandedId === attendanceLog.id;

            return (
              <DataCard
                key={attendanceLog.id}
                onPress={() => {
                  setExpandedId((current) => (current === attendanceLog.id ? null : attendanceLog.id));
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{formatDate(attendanceLog.work_date)}</Text>
                  <StatusBadge status={attendanceLog.status} />
                </View>

                <KeyValueRow
                  label="Company"
                  value={attendanceLog.placement?.company?.name ?? 'No company linked'}
                />
                <KeyValueRow label="Rendered Time" value={formatMinutes(attendanceLog.total_minutes)} />
                <Text style={styles.expandHint}>
                  {isExpanded ? 'Tap to hide details' : 'Tap to view details'}
                </Text>

                {isExpanded ? (
                  <View style={styles.details}>
                    <KeyValueRow label="Time In" value={formatDateTime(attendanceLog.time_in)} />
                    <KeyValueRow label="Time Out" value={formatDateTime(attendanceLog.time_out)} />
                    <KeyValueRow label="Approver" value={attendanceLog.approver?.name ?? 'Pending'} />
                    <Text style={styles.detailLabel}>Remarks</Text>
                    <Text style={styles.detailValue}>
                      {attendanceLog.remarks && attendanceLog.remarks.length > 0
                        ? attendanceLog.remarks
                        : 'No remarks.'}
                    </Text>
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
    lineHeight: 20,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.sm),
  },
  actionBlock: {
    gap: s(appTheme.spacing.sm),
  },
  buttonGroup: {
    gap: s(appTheme.spacing.sm),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(appTheme.spacing.xs),
    borderRadius: s(12),
    paddingVertical: s(appTheme.spacing.sm),
    paddingHorizontal: s(appTheme.spacing.md),
  },
  actionButtonPressed: {
    opacity: 0.88,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  timeInButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeOutButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    fontSize: s(13),
    fontWeight: '700',
    color: colors.text,
  },
  timeOutButtonText: {
    color: '#fff',
  },
  errorText: {
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    borderRadius: s(10),
    padding: s(appTheme.spacing.sm),
  },
  successText: {
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    borderRadius: s(10),
    padding: s(appTheme.spacing.sm),
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
    lineHeight: 20,
  },
});
