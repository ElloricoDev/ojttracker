<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaginatedResourceCollection extends JsonResource
{
    public static $wrap = null;

    /**
     * @param  class-string<JsonResource>  $resourceClass
     */
    public function __construct(
        private readonly LengthAwarePaginator $paginator,
        private readonly string $resourceClass,
    ) {
        parent::__construct($paginator);
    }

    public function toArray(Request $request): array
    {
        $resourceClass = $this->resourceClass;

        return [
            'data' => $this->paginator->getCollection()
                ->map(fn ($item) => (new $resourceClass($item))->resolve($request))
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $this->paginator->currentPage(),
                'last_page' => $this->paginator->lastPage(),
                'per_page' => $this->paginator->perPage(),
                'total' => $this->paginator->total(),
                'from' => $this->paginator->firstItem(),
                'to' => $this->paginator->lastItem(),
            ],
            'links' => [
                'first' => $this->paginator->url(1),
                'last' => $this->paginator->url($this->paginator->lastPage()),
                'prev' => $this->paginator->previousPageUrl(),
                'next' => $this->paginator->nextPageUrl(),
            ],
        ];
    }
}
