# OJT Tracker Mobile (Expo)

Lightweight Expo + React Native shell for the OJT Tracker mobile app (Android-first).

## Prerequisites
- Node.js 18+
- Android Studio emulator or Expo Go on Android device
- Expo account with EAS access for cloud Android builds

## Setup
```bash
cd mobile
# Windows (PowerShell): Copy-Item .env.example .env
# macOS/Linux: cp .env.example .env
npm install
```

> `expo-document-picker` is used for student document uploads.

## Run
```bash
npm run start
npm run start:lan
npm run android
```

## QA / Preflight Commands

Use these before opening PRs and in mobile CI:

```bash
npm run qa:preflight
```

Available QA scripts:
- `npm run typecheck` - TypeScript checks (`tsc --noEmit`)
- `npm run qa:config` - validates resolved Expo config (`expo config --type public`)
- `npm run qa:preflight` - runs `typecheck` + `qa:config`
- `npm run qa` - alias for `qa:preflight`

## Environment Profiles

`app.config.js` injects runtime values into `extra` (`appEnv`, `releaseChannel`, `apiBaseUrl`).

### Development
- Start from `.env.example`
- `EXPO_PUBLIC_APP_ENV=development`
- `EXPO_PUBLIC_RELEASE_CHANNEL=development`
- `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api`

### Staging
- Start from `.env.staging.example`
- Example: `cp .env.staging.example .env` (or `Copy-Item .env.staging.example .env` on PowerShell)
- `EXPO_PUBLIC_APP_ENV=staging`
- `EXPO_PUBLIC_RELEASE_CHANNEL=preview`
- `EXPO_PUBLIC_API_BASE_URL=https://staging-api.ojttracker.example/api`

### Production
- Start from `.env.production.example`
- Example: `cp .env.production.example .env` (or `Copy-Item .env.production.example .env` on PowerShell)
- `EXPO_PUBLIC_APP_ENV=production`
- `EXPO_PUBLIC_RELEASE_CHANNEL=production`
- `EXPO_PUBLIC_API_BASE_URL=https://api.ojttracker.example/api`

Optional Android metadata for release control:
- `ANDROID_APPLICATION_ID` (override Android package id)
- `ANDROID_VERSION_CODE` (explicit Android `versionCode`)
- `EAS_PROJECT_ID` (EAS project UUID for non-interactive CI builds)

## Android Preview Build / Distribution

`mobile/eas.json` includes Android-first profiles:
- `development` - internal APK with development client
- `preview` - internal APK for pilot QA distribution
- `production` - Play Store-ready AAB with auto-increment enabled

Local EAS examples:

```bash
npx eas build --platform android --profile preview
npx eas build --platform android --profile production
```

### GitHub Actions

- `.github/workflows/mobile-qa.yml`
  - Triggers on push/PR changes under `mobile/**`
  - Runs install + `npm run qa:preflight`

- `.github/workflows/mobile-android-preview.yml`
  - Manual trigger (`workflow_dispatch`)
  - Runs `eas build --platform android --profile preview --non-interactive`
  - Allows optional one-off `api_base_url` input override

### Required CI Secrets

Configure in **Repository Settings → Secrets and variables → Actions**:

| Secret | Used in | Purpose |
| --- | --- | --- |
| `EXPO_TOKEN` | `mobile-android-preview.yml` (`expo/expo-github-action`, `eas build`) | Auth to Expo/EAS |
| `EAS_PROJECT_ID` | `mobile-android-preview.yml` -> `app.config.js` (`extra.eas.projectId`) | Non-interactive project targeting |
| `MOBILE_STAGING_API_BASE_URL` | `mobile-android-preview.yml` (`EXPO_PUBLIC_API_BASE_URL`) | Staging API URL embedded in preview APK |

Optional secrets:
- `MOBILE_ANDROID_APPLICATION_ID` for CI package id override
- `MOBILE_ANDROID_VERSION_CODE` for CI versionCode override

## Current Scope
- App bootstrap with TypeScript
- Auth session flow with token persistence and guarded navigation (`Login` + student shell)
- Axios HTTP client with Bearer token + 401 session reset handling
- Student screen shell with navigable sections:
  - Dashboard
  - Placement
  - Attendance
  - Daily Reports
  - Weekly Reports
  - Documents
  - Notifications
  - Profile
- Student action flows wired to `/api/v1/student/*` endpoints:
  - Placement request submission
  - Attendance time in / time out
  - Daily and weekly report submission
  - Document upload with file picker
  - Notification mark-as-read and mark-all-read
- Source folders: `api`, `navigation`, `screens`, `components`, `stores`, `utils`, `theme`
