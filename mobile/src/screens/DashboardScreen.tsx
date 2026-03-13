import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { AuthUser } from '../api/auth';
import {
  getStudentAttendance,
  getStudentDailyReports,
  getStudentDocuments,
  getStudentNotifications,
  getStudentPlacement,
  getStudentUnreadNotifications,
  getStudentWeeklyReports,
} from '../api/student';
import DataCard from '../components/DataCard';
import InfoStateCard from '../components/InfoStateCard';
import KeyValueRow from '../components/KeyValueRow';
import StatusBadge from '../components/StatusBadge';
import StudentScreenLayout from '../components/StudentScreenLayout';
import { useTheme } from '../theme/ThemeProvider';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';
import type {
  AttendanceLog,
  DailyReport,
  Placement,
  StudentDocument,
  StudentNotification,
  WeeklyReport,
} from '../types/student';
import { getApiErrorMessage } from '../utils/errors';
import { formatDate, formatHours, formatMinutes } from '../utils/formatters';

type DashboardScreenProps = {
  user: AuthUser | null;
};

type DashboardSnapshot = {
  placement: Placement | null;
  attendanceTotal: number;
  dailyReportTotal: number;
  weeklyReportTotal: number;
  documentTotal: number;
  notificationTotal: number;
  latestAttendance: AttendanceLog | null;
  latestDailyReport: DailyReport | null;
  latestWeeklyReport: WeeklyReport | null;
  latestDocument: StudentDocument | null;
  unreadNotifications: StudentNotification[];
};

export default function DashboardScreen({ user }: DashboardScreenProps) {
  const { s } = useResponsive();
  const { colors, mode } = useTheme();
  const styles = getStyles(s, colors, mode);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const [placement, attendance, dailyReports, weeklyReports, documents, notifications, unread] =
        await Promise.all([
          getStudentPlacement(),
          getStudentAttendance({
            page: 1,
            perPage: 1,
            sort: 'work_date',
            direction: 'desc',
          }),
          getStudentDailyReports({
            page: 1,
            perPage: 1,
            sort: 'work_date',
            direction: 'desc',
          }),
          getStudentWeeklyReports({
            page: 1,
            perPage: 1,
            sort: 'week_start',
            direction: 'desc',
          }),
          getStudentDocuments({
            page: 1,
            perPage: 1,
            sort: 'submitted_at',
            direction: 'desc',
          }),
          getStudentNotifications({
            page: 1,
            perPage: 1,
            sort: 'created_at',
            direction: 'desc',
          }),
          getStudentUnreadNotifications(5),
        ]);

      setSnapshot({
        placement,
        attendanceTotal: attendance.meta.total,
        dailyReportTotal: dailyReports.meta.total,
        weeklyReportTotal: weeklyReports.meta.total,
        documentTotal: documents.meta.total,
        notificationTotal: notifications.meta.total,
        latestAttendance: attendance.data[0] ?? null,
        latestDailyReport: dailyReports.data[0] ?? null,
        latestWeeklyReport: weeklyReports.data[0] ?? null,
        latestDocument: documents.data[0] ?? null,
        unreadNotifications: unread,
      });
      setError(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load dashboard right now.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard('initial');
    }, [loadDashboard])
  );

  return (
    <StudentScreenLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.name ?? 'Student'}.`}
      headerIconName="view-dashboard-outline"
      refreshing={isRefreshing}
      withBottomInset={false}
      onRefresh={() => {
        void loadDashboard('refresh');
      }}
    >
      {isLoading && !snapshot ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.helperText}>Loading your student overview...</Text>
        </View>
      ) : null}

      {!isLoading && error && !snapshot ? (
        <InfoStateCard
          tone="error"
          title="Dashboard unavailable"
          message={error}
          actionLabel="Retry"
          onActionPress={() => {
            void loadDashboard('initial');
          }}
        />
      ) : null}

      {snapshot ? (
        <>
          {error ? (
            <InfoStateCard
              tone="error"
              title="Showing cached dashboard data"
              message={error}
              actionLabel="Retry"
              onActionPress={() => {
                void loadDashboard('initial');
              }}
            />
          ) : null}

          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroTitle}>Today at a glance</Text>
                <Text style={styles.heroSubtitle}>Track your progress and next actions.</Text>
              </View>
              <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="star-four-points" size={16} color={colors.primary} />
              <Text style={styles.heroBadgeText}>Student</Text>
            </View>
          </View>
          <View style={styles.statGrid}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <View style={styles.statHeader}>
                <MaterialCommunityIcons name="calendar-check" size={16} color={colors.primary} />
                <Text style={styles.statLabel}>Attendance</Text>
              </View>
              <Text style={styles.statValue}>{snapshot.attendanceTotal}</Text>
              <Text style={styles.statMeta}>
                  Last update:{' '}
                  {snapshot.latestAttendance ? formatDate(snapshot.latestAttendance.work_date) : 'No logs yet'}
                </Text>
              </View>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <MaterialCommunityIcons name="notebook-outline" size={16} color={colors.success} />
                <Text style={styles.statLabel}>Reports</Text>
              </View>
                <Text style={styles.statValue}>
                  {snapshot.dailyReportTotal + snapshot.weeklyReportTotal}
                </Text>
                <Text style={styles.statMeta}>Daily + Weekly</Text>
              </View>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.info} />
                <Text style={styles.statLabel}>Documents</Text>
              </View>
                <Text style={styles.statValue}>{snapshot.documentTotal}</Text>
                <Text style={styles.statMeta}>
                  Recent: {snapshot.latestDocument ? formatDate(snapshot.latestDocument.submitted_at) : 'None'}
                </Text>
              </View>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <MaterialCommunityIcons name="bell-outline" size={16} color={colors.warning} />
                <Text style={styles.statLabel}>Notifications</Text>
              </View>
                <Text style={styles.statValue}>{snapshot.notificationTotal}</Text>
                <Text style={styles.statMeta}>{snapshot.unreadNotifications.length} unread</Text>
              </View>
            </View>
          </View>

          <DataCard
            title="Placement Overview"
            icon={<MaterialCommunityIcons name="briefcase-outline" size={16} color={colors.primary} />}
          >
            {snapshot.placement ? (
              <>
                <View style={styles.statusRow}>
                  <StatusBadge status={snapshot.placement.status} />
                  <Text style={styles.statusNote}>
                    {snapshot.placement.status === 'active'
                      ? 'Keep logging hours consistently.'
                      : 'Awaiting updates from your coordinator.'}
                  </Text>
                </View>
                <KeyValueRow
                  label="Company"
                  value={snapshot.placement.company?.name ?? 'No company assigned'}
                />
                <KeyValueRow
                  label="Required Hours"
                  value={
                    typeof snapshot.placement.required_hours === 'number'
                      ? formatHours(snapshot.placement.required_hours)
                      : 'N/A'
                  }
                />
                <KeyValueRow label="Start Date" value={formatDate(snapshot.placement.start_date)} />
                <KeyValueRow label="End Date" value={formatDate(snapshot.placement.end_date)} />
              </>
              ) : (
                <Text style={styles.helperText}>
                  No placement assigned yet. Submit a placement request from the Placement screen.
                </Text>
              )}
            </DataCard>

          <DataCard
            title="Record Totals"
            icon={<MaterialCommunityIcons name="chart-box-outline" size={16} color={colors.primary} />}
          >
            <KeyValueRow label="Attendance Logs" value={`${snapshot.attendanceTotal}`} />
            <KeyValueRow label="Daily Reports" value={`${snapshot.dailyReportTotal}`} />
            <KeyValueRow label="Weekly Reports" value={`${snapshot.weeklyReportTotal}`} />
            <KeyValueRow label="Documents" value={`${snapshot.documentTotal}`} />
            <KeyValueRow label="Notifications" value={`${snapshot.notificationTotal}`} />
          </DataCard>

          <DataCard
            title="Latest Activity"
            icon={<MaterialCommunityIcons name="history" size={16} color={colors.primary} />}
          >
            <KeyValueRow
              label="Recent Attendance"
              value={
                snapshot.latestAttendance
                  ? `${formatDate(snapshot.latestAttendance.work_date)} • ${formatMinutes(snapshot.latestAttendance.total_minutes)}`
                  : 'No attendance logs yet'
              }
            />
            <KeyValueRow
              label="Recent Daily Report"
              value={
                snapshot.latestDailyReport
                  ? `${formatDate(snapshot.latestDailyReport.work_date)} • ${formatHours(snapshot.latestDailyReport.hours_rendered)}`
                  : 'No daily reports yet'
              }
            />
            <KeyValueRow
              label="Recent Weekly Report"
              value={
                snapshot.latestWeeklyReport
                  ? `${formatDate(snapshot.latestWeeklyReport.week_start)} to ${formatDate(snapshot.latestWeeklyReport.week_end)}`
                  : 'No weekly reports yet'
              }
            />
            <KeyValueRow
              label="Recent Document"
              value={
                snapshot.latestDocument
                  ? `${snapshot.latestDocument.document_type} • ${formatDate(snapshot.latestDocument.submitted_at)}`
                  : 'No documents yet'
              }
            />
          </DataCard>

          <DataCard
            title="Unread Notifications"
            subtitle="Latest reminders and alerts"
            icon={<MaterialCommunityIcons name="bell-outline" size={16} color={colors.primary} />}
          >
            {snapshot.unreadNotifications.length === 0 ? (
              <Text style={styles.helperText}>You are all caught up.</Text>
            ) : (
              snapshot.unreadNotifications.map((notification) => (
                <View key={notification.id} style={styles.notificationRow}>
                  <View style={styles.notificationTitleRow}>
                    <MaterialCommunityIcons
                      name="bell-ring-outline"
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                  </View>
                  <Text style={styles.notificationMeta}>{formatDate(notification.created_at)}</Text>
                </View>
              ))
            )}
          </DataCard>
        </>
      ) : null}
    </StudentScreenLayout>
  );
}

const getStyles = (s: (value: number) => number, colors: typeof appTheme.colors, mode: 'light' | 'dark') =>
  StyleSheet.create({
  loadingBlock: {
    paddingVertical: s(appTheme.spacing.xl),
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(appTheme.spacing.sm),
  },
  helperText: {
    fontSize: s(14),
    color: appTheme.colors.mutedText,
    lineHeight: 20,
  },
  heroCard: {
    borderRadius: s(22),
    padding: s(appTheme.spacing.lg),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: s(appTheme.spacing.md),
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(appTheme.spacing.sm),
  },
  heroTitle: {
    fontSize: s(18),
    fontWeight: '700',
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: s(13),
    color: colors.mutedText,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.xs),
    paddingHorizontal: s(appTheme.spacing.sm),
    paddingVertical: s(appTheme.spacing.xs),
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryRing,
  },
  heroBadgeText: {
    fontSize: s(12),
    fontWeight: '600',
    color: colors.primary,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(appTheme.spacing.sm),
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 150,
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: s(appTheme.spacing.md),
    backgroundColor: colors.surface,
    gap: s(appTheme.spacing.xs),
  },
  statCardPrimary: {
    borderColor: colors.primaryRing,
    backgroundColor: colors.primaryLight,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.xs),
  },
  statLabel: {
    fontSize: s(12),
    color: colors.mutedText,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: s(20),
    fontWeight: '700',
    color: colors.text,
  },
  statMeta: {
    fontSize: s(11),
    color: colors.subtleText,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.sm),
  },
  statusNote: {
    fontSize: s(12),
    color: colors.mutedText,
  },
  notificationRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: s(appTheme.spacing.sm),
    gap: s(appTheme.spacing.xs),
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.xs),
  },
  notificationTitle: {
    fontSize: s(14),
    color: colors.text,
    fontWeight: '600',
  },
  notificationMeta: {
    fontSize: s(12),
    color: colors.mutedText,
  },
});
