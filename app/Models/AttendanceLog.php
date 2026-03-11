<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceLog extends Model
{
    /** @use HasFactory<\Database\Factories\AttendanceLogFactory> */
    use HasFactory;

    protected $fillable = [
        'placement_id',
        'work_date',
        'time_in',
        'time_out',
        'total_minutes',
        'status',
        'approved_by',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'work_date' => 'date',
            'time_in' => 'datetime:H:i:s',
            'time_out' => 'datetime:H:i:s',
            'total_minutes' => 'integer',
        ];
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(Placement::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
