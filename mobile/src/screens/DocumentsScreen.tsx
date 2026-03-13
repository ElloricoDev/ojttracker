import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  getStudentDocuments,
  getStudentPlacement,
  uploadStudentDocument,
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
import { formatDateTime } from '../utils/formatters';

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

  return isAllowedExtension || isAllowedMimeType;
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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [isPlacementLoading, setIsPlacementLoading] = useState(true);
  const [isPlacementRefreshing, setIsPlacementRefreshing] = useState(false);

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
      setUploadError(getApiErrorMessage(filePickerError, 'Unable to open file picker right now.'));
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
      setUploadError(getApiErrorMessage(uploadRequestError, 'Unable to upload document right now.'));
    } finally {
      setIsUploading(false);
    }
  }, [documentTypeInput, placement?.id, reload, selectedFile]);

  return (
    <StudentScreenLayout
      title="Documents"
      subtitle="Submit required files and review verification updates."
      refreshing={isRefreshing || isPlacementRefreshing}
      onRefresh={refreshAll}
    >
      <DataCard title="Upload document">
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

        <Text style={styles.formHint}>Accepted formats: PDF, JPG, JPEG, PNG (max 5MB).</Text>
        {formErrors.placement_id ? <Text style={styles.fieldError}>{formErrors.placement_id}</Text> : null}
        {placementError ? <Text style={styles.errorText}>{placementError}</Text> : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Document Type *</Text>
          <TextInput
            editable={!isUploading}
            placeholder="e.g. Weekly Evaluation"
            style={styles.input}
            value={documentTypeInput}
            onChangeText={(value) => {
              setDocumentTypeInput(value);
              setFormErrors((current) => ({ ...current, document_type: undefined }));
            }}
          />
          {formErrors.document_type ? <Text style={styles.fieldError}>{formErrors.document_type}</Text> : null}
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title={isPickingFile ? 'Opening picker...' : selectedFile ? 'Change file' : 'Choose file'}
            onPress={() => {
              void handlePickFile();
            }}
            disabled={isPickingFile || isUploading}
          />
          {selectedFile ? (
            <Button
              title="Clear file"
              onPress={() => {
                setSelectedFile(null);
              }}
              disabled={isUploading || isPickingFile}
            />
          ) : null}
        </View>

        {selectedFile ? (
          <View style={styles.selectedFileCard}>
            <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
            <Text style={styles.selectedFileMeta}>
              {selectedFile.mimeType ?? inferMimeType(selectedFile.name) ?? 'Unknown type'} •{' '}
              {formatFileSize(selectedFile.size)}
            </Text>
          </View>
        ) : null}
        {formErrors.document_file ? <Text style={styles.fieldError}>{formErrors.document_file}</Text> : null}

        {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
        {uploadSuccess ? <Text style={styles.successText}>{uploadSuccess}</Text> : null}

        <Button
          title={isUploading ? 'Uploading document...' : 'Upload document'}
          onPress={() => {
            void handleUpload();
          }}
          disabled={isUploading || isPickingFile || isPlacementLoading || !placement}
        />
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
  formHint: {
    fontSize: 13,
    color: appTheme.colors.mutedText,
    lineHeight: 20,
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
  buttonGroup: {
    gap: appTheme.spacing.sm,
  },
  selectedFileCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 8,
    padding: appTheme.spacing.sm,
    gap: appTheme.spacing.xs,
    backgroundColor: '#F8FAFC',
  },
  selectedFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: appTheme.colors.text,
  },
  selectedFileMeta: {
    fontSize: 12,
    color: appTheme.colors.mutedText,
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
    flex: 1,
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
