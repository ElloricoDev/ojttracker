import { useCallback, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  getStudentDocuments,
  uploadStudentDocument,
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
import { formatDateTime } from '../utils/formatters';
import { usePlacementSession } from '../stores/placementSession';

type UploadFormErrors = Partial<Record<'placement_id' | 'document_type' | 'document_file', string>>;

type PickedDocumentFile = {
  uri: string;
  name: string;
  mimeType: string | null;
  size: number | null;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const ALLOWED_FILE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function getFileExtension(fileName: string): string {
  const lowerFileName = fileName.toLowerCase();
  const lastDotIndex = lowerFileName.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return '';
  }

  return lowerFileName.slice(lastDotIndex);
}

function inferMimeType(fileName: string): string | null {
  const extension = getFileExtension(fileName);

  if (extension === '.pdf') {
    return 'application/pdf';
  }

  if (extension === '.jpg' || extension === '.jpeg') {
    return 'image/jpeg';
  }

  if (extension === '.png') {
    return 'image/png';
  }

  return null;
}

function isAllowedFile(file: PickedDocumentFile): boolean {
  const extension = getFileExtension(file.name);
  const isAllowedExtension = ALLOWED_FILE_EXTENSIONS.includes(extension);
  const isAllowedMimeType = file.mimeType ? ALLOWED_FILE_MIME_TYPES.includes(file.mimeType) : false;

  if (!isAllowedExtension) {
    return false;
  }

  if (file.mimeType) {
    return isAllowedMimeType;
  }

  return true;
}

function formatFileSize(sizeInBytes: number | null): string {
  if (typeof sizeInBytes !== 'number' || Number.isNaN(sizeInBytes)) {
    return 'Unknown size';
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DocumentsScreen() {
  const toast = useToast();
  const { s } = useResponsive();
  const { colors } = useTheme();
  const styles = getStyles(s, colors);
  const {
    placement,
    isLoading: isPlacementLoading,
    isRefreshing: isPlacementRefreshing,
    error: placementError,
    refresh: refreshPlacement,
  } = usePlacementSession();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [documentTypeInput, setDocumentTypeInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<PickedDocumentFile | null>(null);
  const [formErrors, setFormErrors] = useState<UploadFormErrors>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const {
    items: documents,
    error,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    refresh,
    reload,
    loadMore,
  } = usePaginatedResource(getStudentDocuments, {
    perPage: 10,
    sort: 'submitted_at',
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

  const handlePickFile = useCallback(async () => {
    setUploadError(null);
    setUploadSuccess(null);
    setIsPickingFile(true);

    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ALLOWED_FILE_MIME_TYPES,
      });

      if (pickerResult.canceled) {
        return;
      }

      const pickedAsset = pickerResult.assets[0];

      if (!pickedAsset) {
        setUploadError('No file was selected.');
        return;
      }

      setSelectedFile({
        uri: pickedAsset.uri,
        name: pickedAsset.name,
        mimeType: pickedAsset.mimeType ?? null,
        size: pickedAsset.size ?? null,
      });
      setFormErrors((current) => ({ ...current, document_file: undefined }));
    } catch (filePickerError) {
      const message = getApiErrorMessage(filePickerError, 'Unable to open file picker right now.');
      setUploadError(message);
      toast.show({ type: 'error', title: 'File picker', message });
    } finally {
      setIsPickingFile(false);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    const nextErrors: UploadFormErrors = {};
    const placementId = placement?.id ?? null;
    const documentType = documentTypeInput.trim();

    if (!placementId) {
      nextErrors.placement_id = 'A placement is required before uploading documents.';
    }

    if (documentType.length === 0) {
      nextErrors.document_type = 'Document type is required.';
    } else if (documentType.length > 100) {
      nextErrors.document_type = 'Document type must be 100 characters or fewer.';
    }

    if (!selectedFile) {
      nextErrors.document_file = 'Select a document file to upload.';
    } else {
      if (!isAllowedFile(selectedFile)) {
        nextErrors.document_file = 'Allowed formats: PDF, JPG, or PNG.';
      } else if (typeof selectedFile.size === 'number' && selectedFile.size > MAX_FILE_SIZE_BYTES) {
        nextErrors.document_file = 'File size must be 5MB or less.';
      }
    }

    setFormErrors(nextErrors);
    setUploadError(null);
    setUploadSuccess(null);

    if (Object.keys(nextErrors).length > 0 || !placementId || !selectedFile) {
      setUploadError('Please review the highlighted fields.');
      return;
    }

    setIsUploading(true);

    try {
      await uploadStudentDocument({
        placement_id: placementId,
        document_type: documentType,
        document_file: {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType ?? inferMimeType(selectedFile.name) ?? 'application/octet-stream',
        },
      });

      setUploadSuccess('Document uploaded successfully.');
      toast.show({ type: 'success', title: 'Uploaded', message: 'Document uploaded successfully.' });
      setDocumentTypeInput('');
      setSelectedFile(null);
      setFormErrors({});
      reload();
    } catch (uploadRequestError) {
      const apiValidationErrors = getApiValidationErrors(uploadRequestError);
      setFormErrors({
        placement_id: apiValidationErrors.placement_id?.[0],
        document_type: apiValidationErrors.document_type?.[0],
        document_file: apiValidationErrors.document_file?.[0],
      });
      const message = getApiErrorMessage(uploadRequestError, 'Unable to upload document right now.');
      setUploadError(message);
      toast.show({ type: 'error', title: 'Upload failed', message });
    } finally {
      setIsUploading(false);
    }
  }, [documentTypeInput, placement?.id, reload, selectedFile]);

  return (
    <StudentScreenLayout
      title="Documents"
      subtitle="Submit required files and review verification updates."
      headerIconName="file-document-outline"
      refreshing={isRefreshing || isPlacementRefreshing}
      onRefresh={refreshAll}
    >
      <DataCard
        title="Upload document"
        subtitle="Send your required files for verification."
        icon={<MaterialCommunityIcons name="file-upload-outline" size={16} color="#1D4ED8" />}
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

        <View style={styles.formHint}>
          <View style={styles.hintBadge}>
            <MaterialCommunityIcons name="check-circle-outline" size={12} color="#1D4ED8" />
            <Text style={styles.hintBadgeText}>PDF, JPG, PNG</Text>
          </View>
          <Text style={styles.formHintText}>Max 5MB per upload.</Text>
        </View>
        {formErrors.placement_id ? <Text style={styles.fieldError}>{formErrors.placement_id}</Text> : null}
        {placementError ? <Text style={styles.errorText}>{placementError}</Text> : null}

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <View style={styles.labelIcon}>
              <MaterialCommunityIcons name="file-document-outline" size={14} color="#1D4ED8" />
            </View>
            <Text style={styles.label}>Document Type</Text>
            <Text style={styles.requiredTag}>Required</Text>
          </View>
          <TextInput
            editable={!isUploading}
            placeholder="e.g. Weekly Evaluation"
            style={styles.input}
            placeholderTextColor={appTheme.colors.subtleText}
            value={documentTypeInput}
            onChangeText={(value) => {
              setDocumentTypeInput(value);
              setFormErrors((current) => ({ ...current, document_type: undefined }));
            }}
          />
          {formErrors.document_type ? <Text style={styles.fieldError}>{formErrors.document_type}</Text> : null}
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            onPress={() => {
              void handlePickFile();
            }}
            disabled={isPickingFile || isUploading}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && !isPickingFile ? styles.actionButtonPressed : null,
              (isPickingFile || isUploading) && styles.actionButtonDisabled,
            ]}
          >
            <MaterialCommunityIcons name="folder-open-outline" size={16} color="#1D4ED8" />
            <Text style={styles.actionButtonText}>
              {isPickingFile ? 'Opening picker...' : selectedFile ? 'Change file' : 'Choose file'}
            </Text>
          </Pressable>
          {selectedFile ? (
            <Pressable
              onPress={() => {
                setSelectedFile(null);
              }}
              disabled={isUploading || isPickingFile}
              style={({ pressed }) => [
                styles.clearButton,
                pressed && !isUploading ? styles.actionButtonPressed : null,
                (isPickingFile || isUploading) && styles.actionButtonDisabled,
              ]}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={16} color="#B91C1C" />
              <Text style={styles.clearButtonText}>Clear file</Text>
            </Pressable>
          ) : null}
        </View>

        {selectedFile ? (
          <View style={styles.selectedFileCard}>
            <View style={styles.selectedFileHeader}>
              <View style={styles.fileIconBadge}>
                <MaterialCommunityIcons name="file-check-outline" size={16} color="#1D4ED8" />
              </View>
              <View style={styles.selectedFileInfo}>
                <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                <Text style={styles.selectedFileMeta}>
                  {selectedFile.mimeType ?? inferMimeType(selectedFile.name) ?? 'Unknown type'} •{' '}
                  {formatFileSize(selectedFile.size)}
                </Text>
              </View>
            </View>
            <View style={styles.fileStatusRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={14} color="#0F766E" />
              <Text style={styles.fileStatusText}>Ready to upload</Text>
            </View>
          </View>
        ) : null}
        {formErrors.document_file ? <Text style={styles.fieldError}>{formErrors.document_file}</Text> : null}


        <Pressable
          onPress={() => {
            void handleUpload();
          }}
          disabled={isUploading || isPickingFile || isPlacementLoading || !placement}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && !isUploading ? styles.submitButtonPressed : null,
            (isUploading || isPickingFile || isPlacementLoading || !placement) && styles.submitButtonDisabled,
          ]}
        >
          <MaterialCommunityIcons name="cloud-upload-outline" size={16} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {isUploading ? 'Uploading document...' : 'Upload document'}
          </Text>
        </Pressable>
      </DataCard>

      {isLoading && documents.length === 0 ? (
        <DataCard>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.placeholderText}>Loading documents...</Text>
        </DataCard>
      ) : null}

      {!isLoading && error && documents.length === 0 ? (
        <InfoStateCard
          tone="error"
          title="Unable to load documents"
          message={error}
          actionLabel="Retry"
          onActionPress={reloadAll}
        />
      ) : null}

      {!isLoading && !error && documents.length === 0 ? (
        <InfoStateCard
          title="No documents found"
          message="Uploaded files will appear here along with verification updates."
        />
      ) : null}

      {documents.length > 0 ? (
        <>
          {error ? (
            <InfoStateCard
              tone="error"
              title="Unable to refresh documents"
              message={error}
              actionLabel="Retry"
              onActionPress={reloadAll}
            />
          ) : null}

          {documents.map((document) => {
            const isExpanded = expandedId === document.id;

            return (
              <DataCard
                key={document.id}
                onPress={() => {
                  setExpandedId((current) => (current === document.id ? null : document.id));
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{document.document_type}</Text>
                  <StatusBadge status={document.status} />
                </View>

                <KeyValueRow label="File Name" value={document.file_name ?? 'Unknown file'} />
                <KeyValueRow
                  label="Submitted At"
                  value={formatDateTime(document.submitted_at, 'Not submitted')}
                />
                <Text style={styles.expandHint}>
                  {isExpanded ? 'Tap to hide details' : 'Tap to view details'}
                </Text>

                {isExpanded ? (
                  <View style={styles.details}>
                    <KeyValueRow label="Company" value={document.placement?.company?.name ?? 'N/A'} />
                    <KeyValueRow
                      label="Verified At"
                      value={formatDateTime(document.verified_at, 'Not verified')}
                    />
                    <KeyValueRow label="Verifier" value={document.verifier?.name ?? 'Pending'} />
                    <Text style={styles.detailLabel}>File Path</Text>
                    <Text style={styles.detailValue}>{document.file_path ?? 'No file path available.'}</Text>
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
    inlineLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(appTheme.spacing.sm),
    },
    formHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(appTheme.spacing.xs),
      flexWrap: 'wrap',
    },
    hintBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(4),
      paddingHorizontal: s(8),
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: '#EEF2FF',
      borderWidth: 1,
      borderColor: '#C7D2FE',
    },
    hintBadgeText: {
      fontSize: s(11),
      fontWeight: '600',
      color: '#1D4ED8',
    },
    formHintText: {
      fontSize: s(12),
      color: colors.mutedText,
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
      backgroundColor: '#EEF2FF',
      borderWidth: 1,
      borderColor: '#C7D2FE',
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
    buttonGroup: {
      gap: s(appTheme.spacing.xs),
    },
    actionButton: {
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
    actionButtonText: {
      fontSize: s(13),
      fontWeight: '600',
      color: colors.primary,
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(appTheme.spacing.xs),
      borderRadius: s(12),
      paddingVertical: s(appTheme.spacing.sm),
      borderWidth: 1,
      borderColor: colors.error,
      backgroundColor: colors.errorLight,
    },
    clearButtonText: {
      fontSize: s(13),
      fontWeight: '600',
      color: colors.errorText,
    },
    actionButtonPressed: {
      opacity: 0.9,
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
    selectedFileCard: {
      borderWidth: 1,
      borderColor: colors.primaryRing,
      borderRadius: s(12),
      padding: s(appTheme.spacing.sm),
      gap: s(appTheme.spacing.xs),
      backgroundColor: colors.primaryLight,
    },
    selectedFileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(appTheme.spacing.sm),
    },
    fileIconBadge: {
      width: s(36),
      height: s(36),
      borderRadius: s(12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primaryRing,
    },
    selectedFileInfo: {
      flex: 1,
      gap: 2,
    },
    selectedFileName: {
      fontSize: s(13),
      fontWeight: '600',
      color: colors.text,
    },
    selectedFileMeta: {
      fontSize: s(12),
      color: colors.mutedText,
    },
    fileStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
    },
    fileStatusText: {
      fontSize: s(12),
      color: colors.success,
      fontWeight: '600',
    },
    fieldError: {
      color: colors.errorText,
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
      flex: 1,
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
