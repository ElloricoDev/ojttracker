import { httpClient } from './httpClient';

type ApiEnvelope<TData> = {
  data: TData;
  message?: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string | null;
  status: string | null;
  last_login_at: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

type LoginPayload = {
  user: AuthUser;
  token: string;
  token_type: string;
};

type MePayload = {
  user: AuthUser;
};

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await httpClient.post<ApiEnvelope<LoginPayload>>('/v1/auth/login', {
    email,
    password,
  });

  return {
    token: response.data.data.token,
    user: response.data.data.user,
  };
}

export async function me(): Promise<AuthUser> {
  const response = await httpClient.get<ApiEnvelope<MePayload>>('/v1/auth/me');
  return response.data.data.user;
}

export async function logout(): Promise<void> {
  await httpClient.post('/v1/auth/logout');
}
