import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  requestStudentPlacement,
  type StudentPlacementRequestPayload,
} from '../api/student';
import DataCard from '../components/DataCard';
import InfoStateCard from '../components/InfoStateCard';
import KeyValueRow from '../components/KeyValueRow';
import StatusBadge from '../components/StatusBadge';
import StudentScreenLayout from '../components/StudentScreenLayout';
import { useToast } from '../components/ToastProvider';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';
import { getApiErrorMessage, getApiValidationErrors } from '../utils/errors';
import { formatDate, formatHours } from '../utils/formatters';
import { getTodayIsoDate, isValidIsoDate, parsePositiveInteger } from '../utils/validation';
import { usePlacementSession } from '../stores/placementSession';

type PlacementRequestFormErrors = Partial<
  Record<'company_id' | 'start_date' | 'end_date' | 'ojt_batch_id', string>
>;

export default function PlacementScreen() {
  const { s } = useResponsive();
  const styles = getStyles(s);
  const toast = useToast();
  const {
    placement,
    isLoading,
    isRefreshing,
    error,
    refresh: refreshPlacement,
  } = usePlacementSession();

  const [companyIdInput, setCompanyIdInput] = useState('');
  const [startDateInput, setStartDateInput] = useState(getTodayIsoDate());
  const [endDateInput, setEndDateInput] = useState('');
  const [batchIdInput, setBatchIdInput] = useState('');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [requestErrors, setRequestErrors] = useState<PlacementRequestFormErrors>({});
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const handleRequestSubmit = async () => {
    const nextErrors: PlacementRequestFormErrors = {};

    const companyId = parsePositiveInteger(companyIdInput);
    if (!companyId) {
      nextErrors.company_id = 'Enter a valid company ID.';
    }

    const startDate = startDateInput.trim();
    if (!isValidIsoDate(startDate)) {
      nextErrors.start_date = 'Use YYYY-MM-DD format for start date.';
    }

    const endDate = endDateInput.trim();
    if (endDate.length > 0 && !isValidIsoDate(endDate)) {
      nextErrors.end_date = 'Use YYYY-MM-DD format for end date.';
    }

    if (isValidIsoDate(startDate) && isValidIsoDate(endDate) && startDate > endDate) {
      nextErrors.end_date = 'End date cannot be earlier than start date.';
    }

    const batchIdRaw = batchIdInput.trim();
    const batchId = batchIdRaw.length > 0 ? parsePositiveInteger(batchIdRaw) : null;
    if (batchIdRaw.length > 0 && !batchId) {
      nextErrors.ojt_batch_id = 'Batch ID must be a positive number.';
    }

    setRequestErrors(nextErrors);
    setRequestError(null);
    setRequestSuccess(null);

    if (Object.keys(nextErrors).length > 0 || !companyId) {
      setRequestError('Please review the highlighted fields.');
      return;
    }

    const payload: StudentPlacementRequestPayload = {
      company_id: companyId,
      start_date: startDate,
      ...(endDate.length > 0 ? { end_date: endDate } : {}),
      ...(batchId ? { ojt_batch_id: batchId } : {}),
    };

    setIsSubmittingRequest(true);

    try {
      await requestStudentPlacement(payload);
      setRequestSuccess('Placement request submitted successfully.');
      toast.show({ type: 'success', title: 'Request sent', message: 'Placement request submitted.' });
      setCompanyIdInput('');
      setEndDateInput('');
      setBatchIdInput('');
      setRequestErrors({});
      await refreshPlacement();
    } catch (requestSubmitError) {
      const apiValidationErrors = getApiValidationErrors(requestSubmitError);
      setRequestErrors({
        company_id: apiValidationErrors.company_id?.[0],
        start_date: apiValidationErrors.start_date?.[0],
        end_date: apiValidationErrors.end_date?.[0],
        ojt_batch_id: apiValidationErrors.ojt_batch_id?.[0],
      });
      const message = getApiErrorMessage(requestSubmitError, 'Unable to submit placement request right now.');
      setRequestError(message);
      toast.show({ type: 'error', title: 'Request failed', message });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <StudentScreenLayout
      title="Placement"
      subtitle="Your assigned company, adviser, and placement status."
      headerIconName="briefcase-outline"
      showPlacementBanner={false}
      refreshing={isRefreshing}
      onRefresh={() => {
        void refreshPlacement();
      }}
    >
      {isLoading && !placement ? (
        <DataCard>
          <View style={styles.loadingRow}>
            <ActivityIndicator size="large" color={appTheme.colors.primary} />
            <Text style={styles.helperText}>Loading placement information...</Text>
          </View>
        </DataCard>
      ) : null}

      {placement ? (
        <>
          {error ? (
            <InfoStateCard
              tone="error"
              title="Showing last loaded placement"
              message={error}
              actionLabel="Retry"
              onActionPress={() => {
                void refreshPlacement();
              }}
            />
          ) : null}

          <DataCard
            title={placement.company?.name ?? 'Placement assigned'}
            subtitle={`Batch: ${placement.batch?.name ?? 'Not set'}`}
            icon={<MaterialCommunityIcons name="briefcase-outline" size={16} color="#1D4ED8" />}
          >
            <View style={styles.statusRow}>
              <StatusBadge status={placement.status} />
              <Text style={styles.statusNote}>
                {placement.status === 'active'
                  ? 'Keep logging hours consistently.'
                  : 'Awaiting coordinator confirmation.'}
              </Text>
            </View>
            <KeyValueRow label="Start Date" value={formatDate(placement.start_date)} />
            <KeyValueRow label="End Date" value={formatDate(placement.end_date)} />
            <KeyValueRow
              label="Required Hours"
              value={
                typeof placement.required_hours === 'number'
                  ? formatHours(placement.required_hours)
                  : 'N/A'
              }
            />
            <KeyValueRow label="Supervisor" value={placement.supervisor?.name ?? 'Not assigned'} />
            <KeyValueRow label="Adviser" value={placement.adviser?.name ?? 'Not assigned'} />
          </DataCard>

          <DataCard
            title="Company Contact"
            icon={<MaterialCommunityIcons name="office-building" size={16} color="#7C3AED" />}
          >
            <KeyValueRow label="Contact Person" value={placement.company?.contact_person ?? 'N/A'} />
            <KeyValueRow label="Email" value={placement.company?.email ?? 'N/A'} />
            <KeyValueRow label="Phone" value={placement.company?.phone ?? 'N/A'} />
            <KeyValueRow label="Address" value={placement.company?.address ?? 'N/A'} />
          </DataCard>
        </>
      ) : null}

      {!isLoading && !placement ? (
        <>
          <InfoStateCard
            tone={error ? 'error' : 'neutral'}
            title={error ? 'Unable to verify current placement' : 'No placement yet'}
            message={
              error ??
              'You do not have a placement record yet. Use the request form below to submit one.'
            }
            actionLabel={error ? 'Retry' : undefined}
            onActionPress={
              error
                ? () => {
                    void refreshPlacement();
                  }
                : undefined
            }
          />

          <DataCard
            title="Placement request"
            subtitle="Submit your preferred placement details."
            icon={<MaterialCommunityIcons name="clipboard-text-outline" size={16} color="#0F766E" />}
          >
            <Text style={styles.formHint}>
              Company options are not yet available as a dropdown on mobile. Enter the numeric
              company ID provided by your coordinator.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Company ID *</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="identifier" size={16} color={appTheme.colors.mutedText} />
                <TextInput
                keyboardType="number-pad"
                editable={!isSubmittingRequest}
                placeholder="e.g. 12"
                style={styles.input}
                value={companyIdInput}
                onChangeText={(value) => {
                  setCompanyIdInput(value);
                  setRequestErrors((current) => ({ ...current, company_id: undefined }));
                }}
              />
              </View>
              {requestErrors.company_id ? <Text style={styles.fieldError}>{requestErrors.company_id}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Start Date *</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={appTheme.colors.mutedText} />
                <TextInput
                editable={!isSubmittingRequest}
                placeholder="YYYY-MM-DD"
                style={styles.input}
                value={startDateInput}
                onChangeText={(value) => {
                  setStartDateInput(value);
                  setRequestErrors((current) => ({ ...current, start_date: undefined }));
                }}
              />
              </View>
              {requestErrors.start_date ? <Text style={styles.fieldError}>{requestErrors.start_date}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>End Date (optional)</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="calendar-range-outline" size={16} color={appTheme.colors.mutedText} />
                <TextInput
                editable={!isSubmittingRequest}
                placeholder="YYYY-MM-DD"
                style={styles.input}
                value={endDateInput}
                onChangeText={(value) => {
                  setEndDateInput(value);
                  setRequestErrors((current) => ({ ...current, end_date: undefined }));
                }}
              />
              </View>
              {requestErrors.end_date ? <Text style={styles.fieldError}>{requestErrors.end_date}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>OJT Batch ID (optional)</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="tag-outline" size={16} color={appTheme.colors.mutedText} />
                <TextInput
                keyboardType="number-pad"
                editable={!isSubmittingRequest}
                placeholder="e.g. 3"
                style={styles.input}
                value={batchIdInput}
                onChangeText={(value) => {
                  setBatchIdInput(value);
                  setRequestErrors((current) => ({ ...current, ojt_batch_id: undefined }));
                }}
              />
              </View>
              {requestErrors.ojt_batch_id ? <Text style={styles.fieldError}>{requestErrors.ojt_batch_id}</Text> : null}
            </View>


            <Pressable
              onPress={() => {
                void handleRequestSubmit();
              }}
              disabled={isSubmittingRequest}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !isSubmittingRequest && styles.submitButtonPressed,
                isSubmittingRequest && styles.submitButtonDisabled,
              ]}
            >
              {isSubmittingRequest ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="send" size={16} color="#fff" />
              )}
              <Text style={styles.submitLabel}>
                {isSubmittingRequest ? 'Submitting request...' : 'Submit placement request'}
              </Text>
            </Pressable>
          </DataCard>
        </>
      ) : null}
    </StudentScreenLayout>
  );
}

const getStyles = (s: (value: number) => number) =>
  StyleSheet.create({
  helperText: {
    fontSize: s(14),
    color: appTheme.colors.mutedText,
    lineHeight: 20,
  },
  loadingRow: {
    alignItems: 'center',
    gap: s(appTheme.spacing.sm),
  },
  formHint: {
    fontSize: s(13),
    color: appTheme.colors.mutedText,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: s(appTheme.spacing.xs),
  },
  label: {
    fontSize: s(14),
    fontWeight: '600',
    color: appTheme.colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.sm),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: s(12),
    paddingHorizontal: s(appTheme.spacing.sm),
    backgroundColor: '#F8FAFC',
  },
  input: {
    flex: 1,
    paddingVertical: s(appTheme.spacing.sm),
    backgroundColor: 'transparent',
    color: appTheme.colors.text,
  },
  fieldError: {
    color: '#B91C1C',
    fontSize: s(12),
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.sm),
  },
  statusNote: {
    fontSize: s(12),
    color: appTheme.colors.mutedText,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(appTheme.spacing.xs),
    borderRadius: s(12),
    backgroundColor: '#1D4ED8',
    paddingVertical: s(appTheme.spacing.sm),
  },
  submitButtonPressed: {
    opacity: 0.88,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    fontSize: s(13),
    fontWeight: '700',
    color: '#fff',
  },
});
