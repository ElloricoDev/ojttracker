<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evaluation extends Model
{
    /** @use HasFactory<\Database\Factories\EvaluationFactory> */
    use HasFactory;

    protected $fillable = [
        'placement_id',
        'evaluator_type',
        'evaluation_period',
        'evaluator_id',
        'criteria_json',
        'overall_score',
        'remarks',
        'evaluated_at',
    ];

    protected function casts(): array
    {
        return [
            'criteria_json' => 'array',
            'overall_score' => 'decimal:2',
            'evaluated_at' => 'datetime',
        ];
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(Placement::class);
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }
}
