import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
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
import { usePaginatedResource } from '../hooks/usePaginatedResource';
import { appTheme } from '../theme';
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
        refreshAll();
      } catch (requestError) {
        setActionError(getApiErrorMessage(requestError, 'Unable to mark notification as read.'));
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
      refreshAll();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'Unable to mark all notifications as read.'));
    } finally {
      setIsMarkingAll(false);
    }
  }, [refreshAll]);

  return (
    <StudentScreenLayout
      title="Notifications"
      subtitle="Recent announcements and reminders."
      refreshing={isRefreshing || isUnreadRefreshing}
      onRefresh={refreshAll}
    >
      <DataCard title="Unread Notifications">
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
              <Text style={styles.unreadTitle}>{notification.title}</Text>
              <Text style={styles.unreadMeta}>{formatDateTime(notification.created_at)}</Text>
            </View>
          ))
        )}
      </DataCard>

      <DataCard title="Notification actions">
        {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
        {actionSuccess ? <Text style={styles.successText}>{actionSuccess}</Text> : null}
        <Button
          title={isMarkingAll ? 'Marking all as read...' : 'Mark all as read'}
          onPress={() => {
            void handleMarkAllRead();
          }}
          disabled={isMarkingAll || markingNotificationId !== null || !hasUnreadNotifications}
        />
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
                  <Button
                    title={isMarkingThisNotification ? 'Marking as read...' : 'Mark as read'}
                    onPress={() => {
                      void handleMarkRead(notification.id);
                    }}
                    disabled={isMarkingAll || markingNotificationId !== null}
                  />
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

const styles = StyleSheet.create({
  placeholderText: {
    fontSize: 14,
    color: appTheme.colors.mutedText,
    lineHeight: 20,
  },
  unreadItem: {
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    paddingTop: appTheme.spacing.sm,
    gap: appTheme.spacing.xs,
  },
  unreadTitle: {
    fontSize: 14,
    color: appTheme.colors.text,
    fontWeight: '600',
  },
  unreadMeta: {
    fontSize: 12,
    color: appTheme.colors.mutedText,
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
  notificationBody: {
    color: appTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
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
