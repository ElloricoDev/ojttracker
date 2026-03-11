<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    /** @use HasFactory<\Database\Factories\StudentFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'student_no',
        'course',
        'year_level',
        'required_hours',
        'ojt_batch_id',
        'contact_no',
        'address',
        'emergency_contact_name',
        'emergency_contact_no',
    ];

    protected function casts(): array
    {
        return [
            'year_level' => 'integer',
            'required_hours' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function placements(): HasMany
    {
        return $this->hasMany(Placement::class);
    }

    public function ojtBatch(): BelongsTo
    {
        return $this->belongsTo(OjtBatch::class, 'ojt_batch_id');
    }
}
