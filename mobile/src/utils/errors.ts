import axios from 'axios';

type ApiErrorData = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

export type ApiValidationErrors = Record<string, string[]>;

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ApiErrorData | undefined;

    if (typeof responseData?.message === 'string' && responseData.message.length > 0) {
      return responseData.message;
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

export function getApiValidationErrors(error: unknown): ApiValidationErrors {
  if (!axios.isAxiosError(error)) {
    return {};
  }

  const responseData = error.response?.data as ApiErrorData | undefined;

  if (!responseData?.errors || typeof responseData.errors !== 'object') {
    return {};
  }

  const entries = Object.entries(responseData.errors);

  return entries.reduce<ApiValidationErrors>((accumulator, [field, value]) => {
    if (Array.isArray(value)) {
      const messages = value.filter(
        (message): message is string => typeof message === 'string' && message.length > 0
      );

      if (messages.length > 0) {
        accumulator[field] = messages;
      }

      return accumulator;
    }

    if (typeof value === 'string' && value.length > 0) {
      accumulator[field] = [value];
    }

    return accumulator;
  }, {});
}
