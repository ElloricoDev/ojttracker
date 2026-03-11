<?php

namespace App\Http\Controllers;

use App\Support\NotifiesUser;
use App\Http\Requests\StoreCompanyRequest;
use App\Http\Requests\UpdateCompanyRequest;
use App\Models\Company;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    use NotifiesUser;
    public function __construct(private readonly AuditLogService $auditLogService)
    {
    }

    public function index(): Response
    {
        $this->authorize('viewAny', Company::class);
        $search = request('search');
        $perPage = (int) request('per_page', 10);
        $sort = request('sort', 'created_at');
        $direction = request('direction', 'desc');
        $allowedSorts = ['name', 'is_active', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'created_at';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        $companies = Company::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('contact_person', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Company $company) => [
                'id' => $company->id,
                'name' => $company->name,
                'contact_person' => $company->contact_person,
                'email' => $company->email,
                'phone' => $company->phone,
                'is_active' => $company->is_active,
                'moa_start_at' => $company->moa_start_at?->toDateString(),
                'moa_end_at' => $company->moa_end_at?->toDateString(),
            ]);

        return Inertia::render('Companies/Index', [
            'companies' => $companies,
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
        $this->authorize('create', Company::class);
        return Inertia::render('Companies/Create');
    }

    public function store(StoreCompanyRequest $request): RedirectResponse
    {
        $this->authorize('create', Company::class);
        $company = Company::create($request->validated());
        $this->auditLogService->log(
            $request->user(),
            'company.created',
            Company::class,
            $company->id
        );
        $this->toast($request->user()?->id, 'Company created', 'Company has been created.');

        return to_route('companies.index');
    }

    public function edit(Company $company): Response
    {
        $this->authorize('update', $company);
        return Inertia::render('Companies/Edit', [
            'company' => $company,
        ]);
    }

    public function update(UpdateCompanyRequest $request, Company $company): RedirectResponse
    {
        $this->authorize('update', $company);
        $company->update($request->validated());
        $this->auditLogService->log(
            $request->user(),
            'company.updated',
            Company::class,
            $company->id
        );
        $this->toast($request->user()?->id, 'Company updated', 'Company has been updated.');

        return to_route('companies.index');
    }

    public function destroy(Company $company): RedirectResponse
    {
        $this->authorize('delete', $company);
        $company->delete();
        $this->auditLogService->log(
            request()->user(),
            'company.deleted',
            Company::class,
            $company->id
        );
        $this->toast(request()->user()?->id, 'Company deleted', 'Company has been deleted.');

        return to_route('companies.index');
    }
}
