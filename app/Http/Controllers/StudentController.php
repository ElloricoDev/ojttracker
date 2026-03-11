<?php

namespace App\Http\Controllers;

use App\Support\NotifiesUser;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Enums\UserRole;
use App\Models\OjtBatch;
use App\Models\Student;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    use NotifiesUser;
    public function __construct(private readonly AuditLogService $auditLogService)
    {
    }

    public function index(): Response
    {
        $this->authorize('viewAny', Student::class);
        $search = request('search');
        $perPage = (int) request('per_page', 10);
        $sort = request('sort', 'created_at');
        $direction = request('direction', 'desc');
        $allowedSorts = ['student_no', 'course', 'year_level', 'required_hours', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'created_at';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        $students = Student::query()
            ->with(['user', 'ojtBatch'])
            ->when($search, function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('student_no', 'like', "%{$search}%")
                        ->orWhere('course', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('ojtBatch', function ($batchQuery) use ($search) {
                            $batchQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Student $student) => [
                'id' => $student->id,
                'student_no' => $student->student_no,
                'name' => $student->user?->name,
                'email' => $student->user?->email,
                'course' => $student->course,
                'year_level' => $student->year_level,
                'required_hours' => $student->required_hours,
                'batch' => $student->ojtBatch?->name,
            ]);

        return Inertia::render('Students/Index', [
            'students' => $students,
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
        $this->authorize('create', Student::class);
        return Inertia::render('Students/Create', [
            'batches' => OjtBatch::query()->get(['id', 'name']),
        ]);
    }

    public function store(StoreStudentRequest $request): RedirectResponse
    {
        $this->authorize('create', Student::class);
        $payload = $request->validated();

        $student = DB::transaction(function () use ($payload, $request) {
            $user = User::create([
                'name' => $payload['name'],
                'email' => $payload['email'],
                'password' => $payload['password'],
                'role' => UserRole::Student,
            ]);

            $student = Student::create([
                'user_id' => $user->id,
                'student_no' => $payload['student_no'],
                'course' => $payload['course'],
                'year_level' => $payload['year_level'],
                'required_hours' => $payload['required_hours'],
                'ojt_batch_id' => $payload['ojt_batch_id'] ?? null,
                'contact_no' => $payload['contact_no'] ?? null,
                'address' => $payload['address'] ?? null,
                'emergency_contact_name' => $payload['emergency_contact_name'] ?? null,
                'emergency_contact_no' => $payload['emergency_contact_no'] ?? null,
            ]);

            $this->auditLogService->log(
                $request->user(),
                'student.created',
                Student::class,
                $student->id
            );

            return $student;
        });

        $this->toast($request->user()?->id, 'Student created', 'Student account has been created.');

        return to_route('students.index');
    }

    public function edit(Student $student): Response
    {
        $this->authorize('update', $student);
        return Inertia::render('Students/Edit', [
            'student' => $student->load(['user', 'ojtBatch']),
            'batches' => OjtBatch::query()->get(['id', 'name']),
        ]);
    }

    public function update(UpdateStudentRequest $request, Student $student): RedirectResponse
    {
        $this->authorize('update', $student);
        $student->update($request->validated());

        $this->auditLogService->log(
            $request->user(),
            'student.updated',
            Student::class,
            $student->id
        );
        $this->toast($request->user()?->id, 'Student updated', 'Student information has been updated.');

        return to_route('students.index');
    }

    public function destroy(Student $student): RedirectResponse
    {
        $this->authorize('delete', $student);
        DB::transaction(function () use ($student) {
            $this->auditLogService->log(
                request()->user(),
                'student.deleted',
                Student::class,
                $student->id
            );

            $user = $student->user;
            $student->delete();
            $user?->delete();
        });

        $this->toast(request()->user()?->id, 'Student deleted', 'Student account has been deleted.');

        return to_route('students.index');
    }
}

