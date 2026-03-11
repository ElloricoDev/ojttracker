<?php

namespace App\Services;

use App\Models\Document;
use App\Models\User;
use App\Models\Placement;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DocumentService
{
    public function __construct(
        private readonly DocumentRepositoryInterface $documentRepository,
        private readonly AuditLogService $auditLogService,
        private readonly NotificationService $notificationService,
    )
    {
    }

    public function create(array $payload, ?UploadedFile $documentFile, ?User $actor = null): Document
    {
        return DB::transaction(function () use ($payload, $documentFile, $actor) {
            $path = $documentFile?->store(
                'documents/'.$payload['placement_id'],
                'local'
            );

            $document = $this->documentRepository->create([
                'placement_id' => $payload['placement_id'],
                'document_type' => $payload['document_type'],
                'file_path' => $path ?? '',
                'submitted_at' => now(),
                'status' => 'pending',
            ]);

            if ($actor) {
                $this->auditLogService->log(
                    $actor,
                    'document.uploaded',
                    Document::class,
                    $document->id,
                    ['document_type' => $document->document_type]
                );
            }

            $placement = Placement::find($document->placement_id);
            if ($placement) {
                $this->notificationService->notifyPlacementReviewers(
                    $placement,
                    'document.pending',
                    'Document uploaded',
                    'A document was uploaded and awaits verification.',
                    route('documents.index', ['placement_id' => $document->placement_id]),
                    ['document_id' => $document->id, 'document_type' => $document->document_type]
                );
            }

            $this->notificationService->notifyAdminsAndCoordinators(
                'document.pending',
                'Document uploaded',
                'A document was uploaded and awaits verification.',
                route('documents.index', ['placement_id' => $document->placement_id]),
                ['document_id' => $document->id, 'document_type' => $document->document_type]
            );

            return $document;
        });
    }

    public function update(Document $document, array $payload, ?User $user): Document
    {
        return DB::transaction(function () use ($document, $payload, $user) {
            $status = $payload['status'];
            $attributes = ['status' => $status];

            if (in_array($status, ['verified', 'rejected'], true)) {
                $attributes['verified_by'] = $user?->id;
                $attributes['verified_at'] = now();
            } elseif ($status === 'pending') {
                $attributes['verified_by'] = null;
                $attributes['verified_at'] = null;
            }

            $updated = $this->documentRepository->update($document, $attributes);

            if ($user) {
                $this->auditLogService->log(
                    $user,
                    'document.status_changed',
                    Document::class,
                    $updated->id,
                    ['status' => $updated->status]
                );
            }

            $placement = Placement::find($updated->placement_id);
            if ($placement) {
                $this->notificationService->notifyStudent(
                    $placement,
                    'document.status_changed',
                    'Document status updated',
                    'Your document status was updated.',
                    route('documents.index', ['placement_id' => $updated->placement_id]),
                    ['document_id' => $updated->id, 'status' => $updated->status]
                );
            }

            return $updated;
        });
    }

    public function delete(Document $document, ?User $actor = null): void
    {
        if ($document->file_path) {
            Storage::disk('local')->delete($document->file_path);
            Storage::disk('public')->delete($document->file_path);
        }

        if ($actor) {
            $this->auditLogService->log(
                $actor,
                'document.deleted',
                Document::class,
                $document->id,
                ['document_type' => $document->document_type]
            );
        }

        $this->documentRepository->delete($document);
    }
}
