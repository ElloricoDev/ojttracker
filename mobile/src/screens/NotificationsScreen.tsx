import { useCallback, useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getStudentNotifications,
  getStudentUnreadNotifications,
  markAllStudentNotificationsRead,
  markStudentNotificationRead,
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
import type { StudentNotification } from '../types/student';
import { getApiErrorMessage } from '../utils/errors';
import { formatDateTime } from '../utils/formatters';

function formatMetadata(metadata: StudentNotification['metadata']): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return 'No metadata available.';
  }

  return JSON.stringify(metadata, null, 2);
}

export default function NotificationsScreen() {
  const { s } = useResponsive();
  const { colors } = useTheme();
  const styles = getStyles(s, colors);
  const toast = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<StudentNotification[]>([]);
  const [unreadError, setUnreadError] = useState<string | null>(null);
  const [isUnreadLoading, setIsUnreadLoading] = useState(true);
  const [isUnreadRefreshing, setIsUnreadRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [markingNotificationId, setMarkingNotificationId] = useState<number | null>(null);

  const {
    items: notifications,
    error,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    refresh,
    reload,
    loadMore,
  } = usePaginatedResource(getStudentNotifications, {
    perPage: 10,
    sort: 'created_at',
    direction: 'desc',
  });

  const loadUnread = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setIsUnreadRefreshing(true);
    } else {
      setIsUnreadLoading(true);
    }

    setUnreadError(null);

    try {
      const unread = await getStudentUnreadNotifications(5);
      setUnreadNotifications(unread);
      setUnreadError(null);
    } catch (requestError) {
      setUnreadError(getApiErrorMessage(requestError, 'Unable to load unread notifications.'));
    } finally {
      setIsUnreadLoading(false);
      setIsUnreadRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadUnread('initial');
  }, [loadUnread]);

  const refreshAll = useCallback(() => {
    refresh();
    void loadUnread('refresh');
  }, [loadUnread, refresh]);

  const reloadAll = useCallback(() => {
    reload();
    void loadUnread('initial');
  }, [loadUnread, reload]);

  const hasUnreadNotifications =
    unreadNotifications.length > 0 || notifications.some((notification) => !notification.read_at);

  const handleMarkRead = useCallback(
    async (notificationId: number) => {
      setMarkingNotificationId(notificationId);
      setActionError(null);
      setActionSuccess(null);

      try {
        await markStudentNotificationRead(notificationId);
        setUnreadNotifications((current) =>
          current.filter((notification) => notification.id !== notificationId)
        );
        setActionSuccess('Notification marked as read.');
        toast.show({ type: 'success', title: 'Marked read', message: 'Notification updated.' });
        refreshAll();
      } catch (requestError) {
        const message = getApiErrorMessage(requestError, 'Unable to mark notification as read.');
        setActionError(message);
        toast.show({ type: 'error', title: 'Action failed', message });
      } finally {
        setMarkingNotificationId(null);
      }
    },
    [refreshAll]
  );

  const handleMarkAllRead = useCallback(async () => {
    setIsMarkingAll(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const result = await markAllStudentNotificationsRead();
      setUnreadNotifications([]);
      setActionSuccess(
        result.updated_count > 0
          ? `Marked ${result.updated_count} notification(s) as read.`
          : 'All notifications are already read.'
      );
      toast.show({
        type: 'success',
        title: 'All caught up',
        message:
          result.updated_count > 0
            ? 'All notifications marked as read.'
            : 'All notifications are already read.',
      });
      refreshAll();
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Unable to mark all notifications as read.');
      setActionError(message);
      toast.show({ type: 'error', title: 'Action failed', message });
    } finally {
      setIsMarkingAll(false);
    }
  }, [refreshAll]);

  return (
    <StudentScreenLayout
      title="Notifications"
      subtitle="Recent announcements and reminders."
      headerIconName="bell-outline"
      refreshing={isRefreshing || isUnreadRefreshing}
      onRefresh={refreshAll}
    >
      <DataCard
        title="Unread Notifications"
        subtitle="Your latest unread reminders."
        icon={<MaterialCommunityIcons name="bell-outline" size={16} color="#1D4ED8" />}
      >
        {isUnreadLoading ? (
          <>
            <ActivityIndicator size="small" color={appTheme.colors.primary} />
            <Text style={styles.placeholderText}>Loading unread notifications...</Text>
          </>
        ) : unreadError ? (
          <InfoStateCard
            tone="error"
            title="Unread list unavailable"
            message={unreadError}
            actionLabel="Retry"
            onActionPress={() => {
              void loadUnread('initial');
            }}
          />
        ) : unreadNotifications.length === 0 ? (
          <Text style={styles.placeholderText}>No unread notifications.</Text>
        ) : (
          unreadNotifications.map((notification) => (
            <View key={`unread-${notification.id}`} style={styles.unreadItem}>
              <View style={styles.unreadHeader}>
                <View style={styles.unreadDot} />
                <Text style={styles.unreadTitle}>{notification.title}</Text>
              </View>
              <Text style={styles.unreadMeta}>{formatDateTime(notification.created_at)}</Text>
            </View>
          ))
        )}
      </DataCard>

      <DataCard
        title="Notification actions"
        subtitle="Manage unread reminders in one tap."
        icon={<MaterialCommunityIcons name="check-all" size={16} color="#1D4ED8" />}
      >
        <Pressable
          onPress={() => {
            void handleMarkAllRead();
          }}
          disabled={isMarkingAll || markingNotificationId !== null || !hasUnreadNotifications}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !isMarkingAll ? styles.primaryButtonPressed : null,
            (isMarkingAll || markingNotificationId !== null || !hasUnreadNotifications) &&
              styles.primaryButtonDisabled,
          ]}
        >
          <MaterialCommunityIcons name="check-all" size={16} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {isMarkingAll ? 'Marking all as read...' : 'Mark all as read'}
          </Text>
        </Pressable>
      </DataCard>

      {isLoading && notifications.length === 0 ? (
        <DataCard>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.placeholderText}>Loading notifications...</Text>
        </DataCard>
      ) : null}

      {!isLoading && error && notifications.length === 0 ? (
        <InfoStateCard
          tone="error"
          title="Unable to load notifications"
          message={error}
          actionLabel="Retry"
          onActionPress={reloadAll}
        />
      ) : null}

      {!isLoading && !error && notifications.length === 0 ? (
        <InfoStateCard
          title="No notifications yet"
          message="Incoming notifications and alerts will appear here."
        />
      ) : null}

      {notifications.length > 0 ? (
        <>
          {error ? (
            <InfoStateCard
              tone="error"
              title="Unable to refresh notifications"
              message={error}
              actionLabel="Retry"
              onActionPress={reloadAll}
            />
          ) : null}

          {notifications.map((notification) => {
            const isExpanded = expandedId === notification.id;
            const readStatus = notification.read_at ? 'read' : 'unread';
            const isMarkingThisNotification = markingNotificationId === notification.id;

            return (
              <DataCard
                key={notification.id}
                onPress={() => {
                  setExpandedId((current) => (current === notification.id ? null : notification.id));
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{notification.title}</Text>
                  <StatusBadge status={readStatus} />
                </View>

                <Text style={styles.notificationBody}>{notification.body}</Text>
                <KeyValueRow label="Received" value={formatDateTime(notification.created_at)} />
                {!notification.read_at ? (
                  <Pressable
                    onPress={() => {
                      void handleMarkRead(notification.id);
                    }}
                    disabled={isMarkingAll || markingNotificationId !== null}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && !isMarkingThisNotification ? styles.secondaryButtonPressed : null,
                      (isMarkingAll || markingNotificationId !== null) &&
                        styles.secondaryButtonDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons name="check" size={14} color="#1D4ED8" />
                    <Text style={styles.secondaryButtonText}>
                      {isMarkingThisNotification ? 'Marking as read...' : 'Mark as read'}
                    </Text>
                  </Pressable>
                ) : null}
                <Text style={styles.expandHint}>
                  {isExpanded ? 'Tap to hide details' : 'Tap to view details'}
                </Text>

                {isExpanded ? (
                  <View style={styles.details}>
                    <KeyValueRow label="Type" value={notification.type} />
                    <KeyValueRow
                      label="Read At"
                      value={formatDateTime(notification.read_at, 'Unread')}
                    />
                    <Text style={styles.detailLabel}>URL</Text>
                    <Text style={styles.detailValue}>{notification.url ?? 'No URL provided.'}</Text>
                    <Text style={styles.detailLabel}>Metadata</Text>
                    <Text style={styles.detailValue}>{formatMetadata(notification.metadata)}</Text>
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
    unreadItem: {
      borderTopWidth: 1,
      borderTopColor: appTheme.colors.border,
      paddingTop: s(appTheme.spacing.sm),
      gap: s(appTheme.spacing.xs),
    },
    unreadHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
    },
    unreadDot: {
      width: s(8),
      height: s(8),
      borderRadius: s(4),
      backgroundColor: colors.primary,
    },
    unreadTitle: {
      fontSize: s(14),
      color: colors.text,
      fontWeight: '600',
      flex: 1,
    },
    unreadMeta: {
      fontSize: s(12),
      color: colors.mutedText,
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
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(appTheme.spacing.xs),
      borderRadius: s(12),
      paddingVertical: s(appTheme.spacing.sm),
      backgroundColor: colors.primary,
    },
    primaryButtonPressed: {
      opacity: 0.9,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonText: {
      fontSize: s(14),
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(appTheme.spacing.xs),
      borderRadius: s(12),
      paddingVertical: s(appTheme.spacing.sm),
      borderWidth: 1,
      borderColor: colors.primaryRing,
      backgroundColor: colors.primaryLight,
    },
    secondaryButtonPressed: {
      opacity: 0.9,
    },
    secondaryButtonDisabled: {
      opacity: 0.5,
    },
    secondaryButtonText: {
      fontSize: s(13),
      fontWeight: '600',
      color: colors.primary,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: s(appTheme.spacing.sm),
    },
    cardTitle: {
      flex: 1,
      fontSize: s(16),
      fontWeight: '700',
      color: colors.text,
    },
    notificationBody: {
      color: colors.text,
      fontSize: s(14),
      lineHeight: s(20),
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
