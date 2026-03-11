<?php

namespace App\Http\Controllers;

use App\Support\NotifiesUser;
use App\Enums\UserRole;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\UserManagementService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    use NotifiesUser;
    public function __construct(private readonly UserManagementService $userManagementService)
    {
    }

    public function index(): Response
    {
        $this->authorize('viewAny', User::class);
        $search = request('search');
        $perPage = (int) request('per_page', 10);
        $sort = request('sort', 'created_at');
        $direction = request('direction', 'desc');
        $allowedSorts = ['name', 'email', 'role', 'status', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'created_at';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        $users = User::query()
            ->whereIn('role', [UserRole::Admin->value, UserRole::Coordinator->value, UserRole::Adviser->value])
            ->with(['adviserProfile'])
            ->when($search, function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('role', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value ?? (string) $user->role,
                'status' => $user->status,
                'profile' => [
                    'department' => $user->adviserProfile?->department,
                ],
            ]);

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortColumn,
                'direction' => $sortDirection,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);
        $roles = [UserRole::Admin->value, UserRole::Coordinator->value, UserRole::Adviser->value];

        if (request()->user()?->hasRole(UserRole::Coordinator)) {
            $roles = array_values(array_diff($roles, [UserRole::Admin->value]));
        }

        return Inertia::render('Users/Create', [
            'roles' => $roles,
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->authorize('create', User::class);
        $this->userManagementService->create($request->validated(), $request->user());
        $this->toast($request->user()?->id, 'User created', 'User account has been created.');

        return to_route('users.index');
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);
        $user->load(['adviserProfile']);

        if (! in_array($user->role?->value ?? (string) $user->role, [UserRole::Admin->value, UserRole::Coordinator->value, UserRole::Adviser->value], true)) {
            abort(404);
        }

        $roles = [UserRole::Admin->value, UserRole::Coordinator->value, UserRole::Adviser->value];
        if (request()->user()?->hasRole(UserRole::Coordinator)) {
            $roles = array_values(array_diff($roles, [UserRole::Admin->value]));
        }

        return Inertia::render('Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value ?? (string) $user->role,
                'status' => $user->status,
                'adviser' => $user->adviserProfile,
            ],
            'roles' => $roles,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);
        $this->userManagementService->update($user, $request->validated(), $request->user());
        $this->toast($request->user()?->id, 'User updated', 'User account has been updated.');

        return to_route('users.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);
        $this->userManagementService->delete($user, request()->user());
        $this->toast(request()->user()?->id, 'User deleted', 'User account has been deleted.');

        return to_route('users.index');
    }
}
