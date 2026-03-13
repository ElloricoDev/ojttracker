<?php

namespace App\Http\Resources\Api\V1\Auth;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin array{user: User, token: string, token_type?: string} */
class AuthSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'user' => new AuthUserResource($this->resource['user']),
            'token' => $this->resource['token'],
            'token_type' => $this->resource['token_type'] ?? 'Bearer',
        ];
    }
}
