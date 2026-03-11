<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supervisor extends Model
{
    /** @use HasFactory<\Database\Factories\SupervisorFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_id',
        'position',
        'contact_no',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function placements(): HasMany
    {
        return $this->hasMany(Placement::class);
    }
}
