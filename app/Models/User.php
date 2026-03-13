<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'role' => UserRole::class,
        ];
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function supervisorProfile(): HasOne
    {
        return $this->hasOne(Supervisor::class);
    }

    public function adviserProfile(): HasOne
    {
        return $this->hasOne(Adviser::class);
    }

    public function placementsCreated(): HasMany
    {
        return $this->hasMany(Placement::class, 'created_by');
    }

    public function hasRole(UserRole|string $role): bool
    {
        $roleValue = $role instanceof UserRole ? $role->value : $role;

        return ($this->role instanceof UserRole ? $this->role->value : $this->role) === $roleValue;
    }
}
