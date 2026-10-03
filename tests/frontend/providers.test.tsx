// @vitest-environment jsdom
import { act, cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    ActiveStudentsProvider,
    useActiveStudents,
} from "@/components/active-students-provider";
import { useAllStudentInfo } from "@/components/all-student-info-provider";
import { useAuth } from "@/components/auth-provider";
import { useQueryParams } from "@/components/query-params-provider";
import { enqueueApiErrorSnackbar } from "@/components/snackbar-utils";
import {
    StudentInfoProvider,
    useStudentInfo,
} from "@/components/student-info-provider";

vi.mock("@/components/query-params-provider", () => ({ useQueryParams: vi.fn() }));
vi.mock("@/components/auth-provider", () => ({ useAuth: vi.fn() }));
vi.mock("@/components/all-student-info-provider", () => ({
    useAllStudentInfo: vi.fn(),
}));
vi.mock("@/components/snackbar-utils", () => ({
    enqueueApiErrorSnackbar: vi.fn(),
}));

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

function Consumer() {
    useStudentInfo();
    return null;
}

describe("ActiveStudentsProvider", () => {
    const queryParams = {
        actives: ["alice", "bob"],
        setActives: vi.fn(),
        addActive: vi.fn(),
        removeActive: vi.fn(),
    };

    beforeEach(() => {
        vi.mocked(useQueryParams).mockReturnValue(queryParams as never);
    });

    it("exposes the active students from the query params", () => {
        const { result } = renderHook(() => useActiveStudents(), {
            wrapper: ({ children }: { children: ReactNode }) => (
                <ActiveStudentsProvider>{children}</ActiveStudentsProvider>
            ),
        });

        expect(result.current.activeStudents).toEqual(["alice", "bob"]);
        result.current.addActive("carol");
        result.current.removeActive("bob");
        result.current.setActiveStudents([]);
        expect(queryParams.addActive).toHaveBeenCalledWith("carol");
        expect(queryParams.removeActive).toHaveBeenCalledWith("bob");
        expect(queryParams.setActives).toHaveBeenCalledWith([]);
    });

    it("throws when used outside the provider", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => renderHook(() => useActiveStudents())).toThrow(
            /inside ActiveStudentsProvider/,
        );
    });
});

describe("StudentInfoProvider", () => {
    const info = {
        studentFirstName: "Alice",
        studentLastName: "A",
        studentStatus: "Present",
        currentExerciseName: "Ex 1",
        currentExerciseId: 400,
        currentExerciseParentModuleId: 500,
        currentExerciseParentModuleParentSubjectId: 600,
        checkersBrief: "brief",
        mentorFirstName: "Mia",
        mentorLastName: "Mentor",
        mentorUsername: "mentor",
        programName: "Prog",
        hiveId: 10,
        hostname: "pc-10",
        studentNumber: 7,
    };
    const getStudentInfo = vi.fn();

    beforeEach(() => {
        getStudentInfo.mockReset().mockResolvedValue(info);
        vi.mocked(enqueueApiErrorSnackbar).mockReset();
        vi.mocked(useAuth).mockReturnValue({
            clientEnvConfig: { HIVE_HOSTNAME: "hive.test" },
        } as never);
        vi.mocked(useAllStudentInfo).mockReturnValue({ getStudentInfo } as never);
    });

    function renderInfo(username = "alice") {
        return renderHook(() => useStudentInfo(), {
            wrapper: ({ children }: { children: ReactNode }) => (
                <StudentInfoProvider studentUsername={username}>
                    {children}
                </StudentInfoProvider>
            ),
        });
    }

    it("loads and derives the info of a student", async () => {
        const { result } = renderInfo();

        await waitFor(() => expect(result.current.studentName).toBe("Alice A"));
        expect(getStudentInfo).toHaveBeenCalledWith("alice");
        expect(result.current.mentorName).toBe("Mia Mentor");
        expect(result.current.hostname).toBe("pc-10");
        expect(result.current.currentExerciseUrl).toBe(
            "https://hive.test/course/600/500/400#10",
        );
    });

    it("falls back to the username when Hive has no hostname", async () => {
        getStudentInfo.mockResolvedValue({ ...info, hostname: "" });
        const { result } = renderInfo();

        await waitFor(() => expect(result.current.hostname).toBe("alice"));
    });

    it("reports a failed lookup instead of throwing", async () => {
        const error = new Error("down");
        getStudentInfo.mockRejectedValue(error);
        renderInfo();

        await waitFor(() =>
            expect(enqueueApiErrorSnackbar).toHaveBeenCalledWith(
                "Failed to fetch student info",
                error,
            ),
        );
    });

    it("does not look up an empty username", async () => {
        renderInfo("");
        await act(async () => {});
        expect(getStudentInfo).not.toHaveBeenCalled();
    });

    it("throws when used outside the provider", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => render(<Consumer />)).toThrow(/inside StudentInfoProvider/);
    });
});
