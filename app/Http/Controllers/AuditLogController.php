<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', AuditLog::class);
        $search = request('search');
        $perPage = (int) request('per_page', 10);
        $sort = request('sort', 'created_at');
        $direction = request('direction', 'desc');
        $allowedSorts = ['created_at', 'action', 'entity_type', 'entity_id'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'created_at';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        $logs = AuditLog::query()
            ->with('user:id,name,email')
            ->when($search, function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('action', 'like', "%{$search}%")
                        ->orWhere('entity_type', 'like', "%{$search}%")
                        ->orWhere('entity_id', 'like', "%{$search}%")
                        ->orWhere('metadata', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (AuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'entity_type' => class_basename($log->entity_type),
                'entity_id' => $log->entity_id,
                'user' => $log->user ? [
                    'name' => $log->user->name,
                    'email' => $log->user->email,
                ] : null,
                'metadata' => $log->metadata_json,
                'created_at' => $log->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('AuditLogs/Index', [
            'logs' => $logs,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortColumn,
                'direction' => $sortDirection,
            ],
        ]);
    }
}
