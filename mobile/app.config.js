require('dotenv/config');

const DEFAULT_API_BASE_URL = 'http://10.0.2.2:8000/api';
const DEFAULT_APP_ENV = 'development';
const DEFAULT_ANDROID_PACKAGE = 'com.ojttracker.mobile';
const DEFAULT_ANDROID_VERSION_CODE = 1;
const DEFAULT_ICON_PATH = './assets/icon.png';
const DEFAULT_ADAPTIVE_ICON_PATH = './assets/adaptive-icon.png';
const DEFAULT_ADAPTIVE_ICON_BACKGROUND = '#0F172A';

const parseVersionCode = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

module.exports = ({ config }) => {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || DEFAULT_APP_ENV;
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
  const easProjectId = process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId;
  const baseAndroid = config.android ?? {};
  const androidVersionCode = parseVersionCode(
    process.env.ANDROID_VERSION_CODE,
    baseAndroid.versionCode ?? DEFAULT_ANDROID_VERSION_CODE
  );

  return {
    ...config,
    name: 'OJT Tracker',
    slug: 'ojt-tracker-mobile',
    scheme: 'ojttracker',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: config.icon || DEFAULT_ICON_PATH,
    platforms: ['android', 'ios', 'web'],
    android: {
      ...baseAndroid,
      package: process.env.ANDROID_APPLICATION_ID || baseAndroid.package || DEFAULT_ANDROID_PACKAGE,
      versionCode: androidVersionCode,
      adaptiveIcon: {
        ...(baseAndroid.adaptiveIcon ?? {}),
        foregroundImage: baseAndroid.adaptiveIcon?.foregroundImage || DEFAULT_ADAPTIVE_ICON_PATH,
        backgroundColor:
          baseAndroid.adaptiveIcon?.backgroundColor || DEFAULT_ADAPTIVE_ICON_BACKGROUND,
      },
    },
    extra: {
      ...(config.extra ?? {}),
      appEnv,
      releaseChannel: process.env.EXPO_PUBLIC_RELEASE_CHANNEL || appEnv,
      apiBaseUrl,
      eas: {
        ...(config.extra?.eas ?? {}),
        ...(easProjectId ? { projectId: easProjectId } : {}),
      },
    },
  };
};
