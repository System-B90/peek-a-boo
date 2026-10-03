import { expect, type Page, test } from "@playwright/test";

// Student grid, filters and fullscreen (#29). Read-only against the shared
// Hive: everything here lives in the URL, nothing is written.

type Student = { studentUsername: string; studentNumber: number };

async function firstStudent(page: Page): Promise<Student | undefined> {
    const response = await page.request.get("/api/students");
    const body = (await response.json()) as {
        status: number;
        data?: Array<Student>;
    };
    return body.status === 0 ? body.data?.[0] : undefined;
}

test.describe("Student grid", () => {
    test("shows the empty state when no student is active", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByText("No active students!")).toBeVisible({
            timeout: 15_000,
        });
    });

    test("an active student in the URL gets a VNC card", async ({ page }) => {
        const student = await firstStudent(page);
        test.skip(!student, "the Hive roster is empty");

        await page.goto(`/?active=${student!.studentUsername}`);
        await expect(page.locator(".vnc-card")).toHaveCount(1, {
            timeout: 15_000,
        });
        await expect(page.getByText("No active students!")).toHaveCount(0);
    });
});

test.describe("Filters", () => {
    test("a known tag becomes a filter in the URL and Backspace removes it", async ({
        page,
    }) => {
        const student = await firstStudent(page);
        test.skip(!student, "the Hive roster is empty");
        const tag = String(student!.studentNumber);

        await page.goto("/");
        const input = page.getByPlaceholder("Filters...");
        await expect(input).toBeVisible({ timeout: 15_000 });

        await input.fill(tag);
        await input.press("Enter");
        await expect(page).toHaveURL(new RegExp(`[?&]filter=${tag}(&|$)`));
        await expect(input).toHaveValue("");

        await input.press("Backspace");
        await expect(page).not.toHaveURL(/[?&]filter=[^&]/);
    });
});

test.describe("Fullscreen", () => {
    test("renders one full-size card for the requested student", async ({
        page,
    }) => {
        const student = await firstStudent(page);
        test.skip(!student, "the Hive roster is empty");

        await page.goto(`/fullscreen?username=${student!.studentUsername}`);
        await expect(page).not.toHaveURL(/\/login/);
        const card = page.locator(".vnc-card");
        await expect(card).toHaveCount(1, { timeout: 15_000 });
        await expect(card).toHaveClass(/m-0/);
    });
});
