import Constants from 'expo-constants';

type ExpoExtra = {
  apiBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
const fallbackApiBaseUrl = 'http://10.0.2.2:8000/api';

export const API_BASE_URL =
  typeof extra.apiBaseUrl === 'string' && extra.apiBaseUrl.length > 0
    ? extra.apiBaseUrl
    : fallbackApiBaseUrl;
