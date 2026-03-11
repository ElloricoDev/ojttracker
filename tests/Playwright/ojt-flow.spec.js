import { expect, test } from '@playwright/test';

const login = async (page, email = 'admin@ojttracker.test') => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();
};

const selectFirstOption = async (page, selector) => {
    const select = page.locator(selector);
    await select.selectOption({ index: 1 });
};

const selectLastOption = async (page, selector) => {
    const select = page.locator(selector);
    const count = await select.locator('option').count();
    await select.selectOption({ index: Math.max(1, count - 1) });
};

const clickSidebarLink = async (page, name) => {
    await page.locator('aside').getByRole('link', { name }).click();
};

test('dashboard and placement navigation flow', async ({ page }) => {
    await login(page);

    await expect(page.getByRole('heading', { name: 'OJT Dashboard' })).toBeVisible();
    await clickSidebarLink(page, 'Placements');
    await expect(page.getByRole('heading', { name: 'Placements' })).toBeVisible();
});

test('placement creation and approval flow', async ({ page }) => {
    await login(page, 'coordinator@ojttracker.test');

    await clickSidebarLink(page, 'Placements');
    await page.getByRole('link', { name: 'New Placement' }).click();
    await expect(page.getByRole('heading', { name: 'Create Placement' })).toBeVisible();

    await selectLastOption(page, '#student');
    await selectFirstOption(page, '#company');
    await selectFirstOption(page, '#supervisor');
    await selectFirstOption(page, '#adviser');
    await selectFirstOption(page, '#batch');

    await page.locator('#required_hours').fill('486');
    await page.locator('#start_date').fill('2026-03-10');
    await page.locator('#status').selectOption('pending');
    await page.getByRole('button', { name: 'Save Placement' }).click();

    await page.waitForURL('**/placements');
    await expect(page.getByRole('heading', { name: 'Placements' })).toBeVisible();
    await page.getByRole('button', { name: 'Approve' }).first().click();
    await expect(page.getByText('Placement approved.')).toBeVisible();
});

test('attendance time in/out flow', async ({ page }) => {
    await login(page);

    await clickSidebarLink(page, 'Attendance');
    await page.waitForURL('**/attendance');
    await expect(page.getByRole('heading', { name: 'Attendance Logs' })).toBeVisible();
    await selectFirstOption(page, 'select');

    await page.getByRole('button', { name: 'Time In' }).click();
    await expect(page.getByText('Time in logged.')).toBeVisible();
    await page.getByRole('button', { name: 'Time Out' }).click();
    await expect(page.getByText('Time out logged.')).toBeVisible();
});

test('daily report submission and review flow', async ({ page }) => {
    await login(page);

    await clickSidebarLink(page, 'Daily Reports');
    await page.waitForURL('**/daily-reports');
    await expect(page.getByRole('heading', { name: 'Daily Reports' })).toBeVisible();
    await selectFirstOption(page, '#placement');

    const today = new Date().toISOString().slice(0, 10);
    await page.locator('#work_date').fill(today);
    await page.locator('#hours_rendered').fill('8');
    await page.locator('#accomplishments').fill('Completed assigned tasks for the day.');
    await page.getByRole('button', { name: 'Submit Report' }).click();

    await expect(page.getByText('Daily report submitted.')).toBeVisible();
    await page.getByRole('button', { name: 'Approve' }).first().click();
    await expect(page.getByText('Daily report updated.')).toBeVisible();
});

test('daily report validation errors render', async ({ page }) => {
    await login(page);

    await clickSidebarLink(page, 'Daily Reports');
    await page.waitForURL('**/daily-reports');
    await page.locator('#placement').selectOption({ index: 0 });
    await page.getByRole('button', { name: 'Submit Report' }).click();
    await expect(page.getByText('The work date field is required.')).toBeVisible();
    await expect(page.getByText('The accomplishments field is required.')).toBeVisible();
});
