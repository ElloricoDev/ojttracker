<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeeklyReport extends Model
{
    /** @use HasFactory<\Database\Factories\WeeklyReportFactory> */
    use HasFactory;

    protected $fillable = [
        'placement_id',
        'week_start',
        'week_end',
        'accomplishments',
        'hours_rendered',
        'status',
        'reviewer_id',
        'reviewer_comment',
    ];

    protected function casts(): array
    {
        return [
            'week_start' => 'date',
            'week_end' => 'date',
            'hours_rendered' => 'decimal:2',
        ];
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(Placement::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
