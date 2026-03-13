<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ($user->status ?? 'active') === 'active') {
            return $next($request);
        }

        $message = 'Your account is inactive. Please contact the administrator.';

        if ($request->is('api/*')) {
            abort(403, $message);
        }

        if (Auth::check()) {
            Auth::logout();
        }

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        abort(403, $message);
    }
}
