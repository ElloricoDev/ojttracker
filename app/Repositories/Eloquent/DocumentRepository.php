<?php

namespace App\Repositories\Eloquent;

use App\Models\Document;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DocumentRepository implements DocumentRepositoryInterface
{
    public function paginateForPlacement(int $placementId, int $perPage = 15, string $search = '', string $sort = 'submitted_at', string $direction = 'desc'): LengthAwarePaginator
    {
        $allowedSorts = ['submitted_at', 'status', 'document_type', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'submitted_at';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        return Document::query()
            ->with(['verifier:id,name'])
            ->where('placement_id', $placementId)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('document_type', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->through(function (Document $document) {
                $document->download_url = $document->file_path
                    ? route('documents.download', $document)
                    : null;

                return $document;
            })
            ->withQueryString();
    }

    public function create(array $attributes): Document
    {
        return Document::create($attributes);
    }

    public function update(Document $document, array $attributes): Document
    {
        $document->update($attributes);

        return $document->refresh();
    }

    public function delete(Document $document): void
    {
        $document->delete();
    }
}
