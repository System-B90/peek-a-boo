import { readFileSync } from "fs";
import path from "path";

import { resetHiveServiceClientCache } from "@system-b90/hive-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSetting } from "@/server-api/settings";
import { getStudents } from "@/server-api/students";

vi.mock("@/server-api/settings", () => ({ getSetting: vi.fn() }));

const SETTINGS: Record<string, string> = {
    HIVE_HOSTNAME: "hive.test",
    HIVE_API_USERNAME: "api",
    HIVE_API_PASSWORD: "api-pw",
};

const MENTOR = {
    id: 1,
    username: "mentor",
    first_name: "Mia",
    last_name: "Mentor",
    clearance: 3,
    status: "Present",
};
const ALICE = {
    id: 10,
    username: "alice",
    number: 7,
    first_name: "Alice",
    last_name: "A",
    checkers_brief: "brief",
    clearance: 1,
    status: "Present",
    hostname: "pc-10",
    mentor: 1,
    program: 100,
    queue: 200,
    current_assignment: 300,
};
const BOB = {
    id: 11,
    username: "bob",
    first_name: "Bob",
    last_name: "B",
    clearance: 1,
    status: "Absent",
    program: 100,
    mentor: null,
    queue: null,
    current_assignment: null,
};
// No program: the old SQL inner join dropped such users, so must we.
const ORPHAN = { id: 12, username: "orphan", clearance: 1, program: null };

const ROUTES: Record<string, unknown> = {
    "/api/core/token/": { access: "acc", refresh: "ref" },
    "/api/core/management/users/": [MENTOR, ALICE, BOB, ORPHAN],
    "/api/core/course/programs/": [{ id: 100, name: "Prog" }],
    "/api/core/queues/": [{ id: 200, name: "Queue A" }],
    "/api/core/assignments/300/": { id: 300, exercise: 400 },
    "/api/core/course/exercises/400/": {
        id: 400,
        name: "Ex 1",
        parent_module: 500,
        parent_subject: 600,
    },
};

let calls: Array<{ url: URL; init?: RequestInit }>;

beforeEach(() => {
    resetHiveServiceClientCache();
    vi.mocked(getSetting).mockImplementation(
        async (key: string) => SETTINGS[key] ?? "",
    );
    calls = [];
    vi.stubGlobal(
        "fetch",
        vi.fn(async (input: string, init?: RequestInit) => {
            const url = new URL(String(input));
            calls.push({ url, init });
            const body = ROUTES[url.pathname];
            return body === undefined
                ? new Response("{}", { status: 404 })
                : Response.json(body);
        }),
    );
});

afterEach(() => vi.unstubAllGlobals());

describe("getStudents", () => {
    it("maps Hive API data to the roster shape the client consumes", async () => {
        const rows = await getStudents();

        expect(rows).toEqual([
            {
                mentorFirstName: "Mia",
                mentorLastName: "Mentor",
                mentorUsername: "mentor",
                studentUsername: "alice",
                studentNumber: 7,
                studentFirstName: "Alice",
                studentLastName: "A",
                checkersBrief: "brief",
                studentStatus: "Present",
                hiveId: 10,
                hostname: "pc-10",
                queueName: "Queue A",
                programName: "Prog",
                currentExerciseName: "Ex 1",
                currentExerciseId: 400,
                currentExerciseParentModuleId: 500,
                currentExerciseParentModuleParentSubjectId: 600,
            },
            expect.objectContaining({
                studentUsername: "bob",
                mentorUsername: null,
                queueName: null,
                currentExerciseId: null,
                hostname: "",
            }),
        ]);
    });

    it("filters to one student by username", async () => {
        const rows = await getStudents("bob");
        expect(rows.map((r) => r.studentUsername)).toEqual(["bob"]);
    });

    it("authenticates as the service account and calls only Hive's API", async () => {
        await getStudents();

        const token = calls.find((c) => c.url.pathname === "/api/core/token/");
        expect(JSON.parse(token?.init?.body as string)).toEqual({
            username: "api",
            password: "api-pw",
        });
        for (const call of calls) {
            expect(call.url.origin).toBe("https://hive.test");
            expect(call.url.pathname.startsWith("/api/core/")).toBe(true);
        }
    });

    it("degrades to no current exercise when its lookup fails", async () => {
        delete ROUTES["/api/core/assignments/300/"];
        try {
            const [alice] = await getStudents("alice");
            expect(alice?.currentExerciseId).toBeNull();
        } finally {
            ROUTES["/api/core/assignments/300/"] = { id: 300, exercise: 400 };
        }
    });
});

// Regression for #102: the roster used to be a SQL join straight against
// Hive's internal Postgres, bypassing Hive's authorization.
describe("no direct Hive database access (#102)", () => {
    it("does not depend on a Postgres driver", () => {
        const pkg = JSON.parse(
            readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
        ) as { dependencies: Record<string, string> };
        expect(pkg.dependencies).not.toHaveProperty("postgres");
    });
});
