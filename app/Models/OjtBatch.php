<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OjtBatch extends Model
{
    /** @use HasFactory<\Database\Factories\OjtBatchFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'school_year',
        'semester',
        'start_date',
        'end_date',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function placements(): HasMany
    {
        return $this->hasMany(Placement::class);
    }
}
