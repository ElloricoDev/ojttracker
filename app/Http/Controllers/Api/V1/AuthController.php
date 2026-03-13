<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Resources\Api\V1\Auth\AuthSessionResource;
use App\Http\Resources\Api\V1\Auth\AuthUserPayloadResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::query()
            ->where('email', $credentials['email'])
            ->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (($user->status ?? 'active') !== 'active') {
            return response()->json([
                'message' => 'Your account is inactive. Please contact the administrator.',
            ], 403);
        }

        if (! $user->hasRole(UserRole::Student)) {
            return response()->json([
                'message' => 'Mobile access is currently limited to student accounts.',
            ], 403);
        }

        $token = $user->createToken('mobile-auth')->plainTextToken;

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        return response()->json([
            'message' => 'Login successful.',
            'data' => new AuthSessionResource([
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
            ]),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return response()->json([
            'data' => new AuthUserPayloadResource($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()?->currentAccessToken();

        if (! $token) {
            return response()->json([
                'message' => 'No active token found.',
            ]);
        }

        $token->delete();

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }
}
