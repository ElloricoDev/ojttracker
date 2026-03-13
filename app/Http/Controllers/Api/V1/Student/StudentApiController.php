<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PaginatedResourceCollection;
use App\Models\Placement;
use App\Models\Student;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class StudentApiController extends Controller
{
    protected function studentUser(Request $request): User
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->hasRole(UserRole::Student)) {
            abort(403, 'This endpoint is only available to student accounts.');
        }

        $user->loadMissing('studentProfile');

        if (! $user->studentProfile instanceof Student) {
            abort(403, 'Student profile not found for this account.');
        }

        return $user;
    }

    protected function student(Request $request): Student
    {
        return $this->studentUser($request)->studentProfile;
    }

    protected function perPage(Request $request, int $default = 10): int
    {
        $perPage = (int) $request->integer('per_page', $default);

        return in_array($perPage, [10, 25, 50, 100], true) ? $perPage : $default;
    }

    protected function direction(Request $request): string
    {
        return strtolower($request->string('direction')->toString()) === 'asc' ? 'asc' : 'desc';
    }

    protected function placementId(Request $request): ?int
    {
        $placementId = (int) $request->integer('placement_id');

        return $placementId > 0 ? $placementId : null;
    }

    protected function ownedPlacement(Student $student, int $placementId): Placement
    {
        return Placement::query()
            ->where('student_id', $student->id)
            ->whereKey($placementId)
            ->firstOrFail();
    }

    protected function paginatedResponse(LengthAwarePaginator $paginator, string $resourceClass): JsonResponse
    {
        return (new PaginatedResourceCollection($paginator, $resourceClass))->response();
    }
}
