<?php

namespace App\Http\Resources\Api\V1\Auth;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class AuthUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role?->value ?? (string) $this->role,
            'status' => $this->status,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
        ];
    }
}
