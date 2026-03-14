<?php

namespace App\Repositories\Contracts;

use App\Models\Document;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface DocumentRepositoryInterface
{
    public function paginateForPlacement(int $placementId, int $perPage = 15, string $search = '', string $sort = 'submitted_at', string $direction = 'desc'): LengthAwarePaginator;

    public function paginateForPlacements(?array $placementIds, int $perPage = 15, string $search = '', string $sort = 'submitted_at', string $direction = 'desc'): LengthAwarePaginator;

    public function create(array $attributes): Document;

    public function update(Document $document, array $attributes): Document;

    public function delete(Document $document): void;
}
