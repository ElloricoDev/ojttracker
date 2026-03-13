let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const authStore = {
  getAccessToken: () => accessToken,
  setAccessToken: (token: string | null) => {
    accessToken = token;
  },
  clearAccessToken: () => {
    accessToken = null;
  },
  setUnauthorizedHandler: (handler: (() => void) | null) => {
    unauthorizedHandler = handler;
  },
  notifyUnauthorized: () => {
    unauthorizedHandler?.();
  },
};
