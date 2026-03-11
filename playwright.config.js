import { defineConfig } from '@playwright/test';

const chromePath = process.env.PLAYWRIGHT_CHROME_PATH;

export default defineConfig({
    testDir: './tests/Playwright',
    timeout: 30_000,
    use: {
        baseURL: 'http://127.0.0.1:8000',
        headless: true,
        browserName: 'chromium',
        ...(chromePath
            ? {
                channel: 'chrome',
                launchOptions: {
                    executablePath: chromePath,
                },
            }
            : {}),
    },
});
