<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'contact_person',
        'email',
        'phone',
        'moa_start_at',
        'moa_end_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'moa_start_at' => 'date',
            'moa_end_at' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function supervisors(): HasMany
    {
        return $this->hasMany(Supervisor::class);
    }

    public function placements(): HasMany
    {
        return $this->hasMany(Placement::class);
    }
}
