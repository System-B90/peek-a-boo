import postgres from "postgres";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSetting } from "@/server-api/settings";

vi.mock("postgres", () => ({ default: vi.fn() }));

vi.mock("@/server-api/settings", () => ({
    getSetting: vi.fn(),
}));

vi.mock("@/server-api/hive", () => ({
    hiveErrorHandler: vi.fn(async (error: unknown) => error),
}));

/**
 * Records how the module builds its queries.
 *
 * `sql` is the tagged-template entry point; `sql.unsafe` is raw text. A bound
 * parameter shows up as an entry in `values`, concatenated text does not — which
 * is exactly the distinction this file exists to pin.
 */
function makeFakeSql() {
    const calls: Array<{ strings: Array<string>; values: Array<unknown> }> = [];
    const unsafeCalls: Array<string> = [];

    const sql = ((strings: TemplateStringsArray, ...values: Array<unknown>) => {
        calls.push({ strings: [...strings], values });
        return Promise.resolve([]);
    }) as unknown as Record<string, unknown> & {
        unsafe: (text: string) => unknown;
    };

    sql.unsafe = (text: string) => {
        unsafeCalls.push(text);
        // Returned into a template hole for the base query; the fake template
        // tag records it as a value, so mark it recognizably.
        return { __unsafe: text };
    };

    return { sql, calls, unsafeCalls };
}

async function loadModule() {
    vi.resetModules();
    return await import("@/server-api/postgres");
}

describe("queryPostgres", () => {
    let fake: ReturnType<typeof makeFakeSql>;

    beforeEach(() => {
        fake = makeFakeSql();
        vi.mocked(postgres).mockReset().mockReturnValue(fake.sql as never);
        vi.mocked(getSetting)
            .mockReset()
            .mockImplementation(async (key: string) => `value-for-${key}`);
    });

    it("binds the username as a parameter instead of concatenating it", async () => {
        const { queryPostgres } = await loadModule();

        await queryPostgres("alice");

        // The username must arrive as a bound value...
        expect(fake.calls).toHaveLength(1);
        expect(fake.calls[0].values).toContain("alice");
        // ...and must never appear inside any raw SQL text.
        for (const text of fake.unsafeCalls) {
            expect(text).not.toContain("alice");
        }
    });

    it("does not let a quote in the username break out of the query", async () => {
        const { queryPostgres } = await loadModule();
        const injection = "' OR '1'='1";

        await queryPostgres(injection);

        expect(fake.calls[0].values).toContain(injection);
        for (const text of fake.unsafeCalls) {
            expect(text).not.toContain("OR '1'='1");
        }
    });

    it("runs the unfiltered query when no username is given", async () => {
        const { queryPostgres } = await loadModule();

        await queryPostgres();

        expect(fake.unsafeCalls).toHaveLength(1);
        expect(fake.unsafeCalls[0]).toContain("FROM management_courseuser");
        expect(fake.unsafeCalls[0]).not.toContain("mentee.username =");
    });

    it("reuses the connection across calls", async () => {
        const { queryPostgres } = await loadModule();

        await queryPostgres();
        await queryPostgres("alice");

        expect(vi.mocked(postgres)).toHaveBeenCalledTimes(1);
    });
});
