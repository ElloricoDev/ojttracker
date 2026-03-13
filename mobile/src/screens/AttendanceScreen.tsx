import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import {
  getStudentAttendance,
  getStudentPlacement,
  submitStudentAttendanceTimeIn,
  submitStudentAttendanceTimeOut,
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
import { getApiErrorMessage } from '../utils/errors';
import { formatDate, formatDateTime, formatMinutes } from '../utils/formatters';

type AttendanceAction = 'time_in' | 'time_out';

export default function AttendanceScreen() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [isPlacementLoading, setIsPlacementLoading] = useState(true);
  const [isPlacementRefreshing, setIsPlacementRefreshing] = useState(false);
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

  const handleAttendanceAction = useCallback(
    async (action: AttendanceAction) => {
      if (!placement?.id) {
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
        } else {
          await submitStudentAttendanceTimeOut({ placement_id: placement.id });
          setAttendanceActionSuccess('Time out logged successfully.');
        }

        reload();
      } catch (actionError) {
        setAttendanceActionError(
          getApiErrorMessage(actionError, 'Unable to submit attendance action right now.')
        );
      } finally {
        setActiveAction(null);
      }
    },
    [placement?.id, reload]
  );

  return (
    <StudentScreenLayout
      title="Attendance"
      subtitle="Daily attendance logs from your placement."
      refreshing={isRefreshing || isPlacementRefreshing}
      onRefresh={refreshAll}
    >
      <DataCard title="Attendance actions">
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
              <Button
                title={activeAction === 'time_in' ? 'Logging time in...' : 'Time In'}
                onPress={() => {
                  void handleAttendanceAction('time_in');
                }}
                disabled={activeAction !== null}
              />
              <Button
                title={activeAction === 'time_out' ? 'Logging time out...' : 'Time Out'}
                onPress={() => {
                  void handleAttendanceAction('time_out');
                }}
                disabled={activeAction !== null}
              />
            </View>
          </View>
        )}

        {placementError ? <Text style={styles.errorText}>{placementError}</Text> : null}
        {attendanceActionError ? <Text style={styles.errorText}>{attendanceActionError}</Text> : null}
        {attendanceActionSuccess ? <Text style={styles.successText}>{attendanceActionSuccess}</Text> : null}
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
  actionBlock: {
    gap: appTheme.spacing.sm,
  },
  buttonGroup: {
    gap: appTheme.spacing.sm,
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
