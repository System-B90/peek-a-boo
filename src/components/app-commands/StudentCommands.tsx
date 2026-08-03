"use client";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Command, CommandQuery, useCommands } from "@system-b90/command-palette";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

import { useActiveStudents } from "@/components/active-students-provider";
import { useAllStudentInfo } from "@/components/all-student-info-provider";
import { COMMAND_GROUPS } from "@/components/app-commands/labels";
import { StudentInfo } from "@/shared-api/types";

/**
 * Two commands per student: put their screen on the grid (the common case), and
 * open it standalone. Watching is a toggle, so the title flips with state.
 */
function buildStudentCommands(
    students: Array<StudentInfo>,
    activeStudents: Array<string>,
    toggleWatch: (student: StudentInfo, isWatched: boolean) => void,
    openStandalone: (student: StudentInfo) => void,
): Array<Command> {
    return students.flatMap((student) => {
        const isWatched = activeStudents.includes(student.studentUsername);
        // Same tokens for both commands: someone searching a student's number
        // or mentor should find either action.
        const keywords = [
            student.studentUsername,
            String(student.studentNumber),
            student.mentorUsername,
            student.programName,
            student.hostname,
        ].filter(Boolean);

        return [
            {
                id: `student.watch.${student.studentUsername}`,
                title: isWatched
                    ? `Stop watching ${student.studentName}`
                    : `Watch ${student.studentName}`,
                subtitle: student.currentExerciseName || student.studentStatus,
                group: COMMAND_GROUPS.students,
                kind: "entity" as const,
                icon: isWatched ? <VisibilityOffIcon /> : <VisibilityIcon />,
                keywords,
                run: () => toggleWatch(student, isWatched),
            },
            {
                id: `student.open.${student.studentUsername}`,
                title: `Open ${student.studentName}'s screen`,
                subtitle: student.hostname,
                group: COMMAND_GROUPS.students,
                kind: "entity" as const,
                icon: <OpenInNewIcon />,
                keywords,
                // Secondary to watching, which is what the grid is for.
                priority: -0.5,
                run: () => openStandalone(student),
            },
        ];
    });
}

/**
 * Contributes per-student commands, plus the two roster-wide actions that read
 * the same providers.
 *
 * Rendered below the palette provider rather than inside it: the palette is
 * mounted high enough for the mentor access bar to reach, and the student
 * providers live below that point.
 */
export function StudentCommands(): null {
    const router = useRouter();
    const { studentInfoList, refetchAllStudentInfo } = useAllStudentInfo();
    const { activeStudents, addActive, removeActive, setActiveStudents } =
        useActiveStudents();

    const toggleWatch = useCallback(
        (student: StudentInfo, isWatched: boolean) =>
            isWatched
                ? removeActive(student.studentUsername)
                : addActive(student.studentUsername),
        [addActive, removeActive],
    );

    const openStandalone = useCallback(
        (student: StudentInfo) => router.push(`/vnc/${student.hostname}`),
        [router],
    );

    const rosterCommands = useMemo<Array<Command>>(
        () => [
            {
                id: "session.reload",
                title: "Reload all student data",
                group: COMMAND_GROUPS.session,
                icon: <RefreshIcon />,
                keywords: ["reload", "refresh", "refetch", "update"],
                run: () => refetchAllStudentInfo(),
            },
            {
                id: "session.close-all",
                title: "Close all open screens",
                subtitle:
                    activeStudents.length > 0
                        ? `${activeStudents.length} open`
                        : undefined,
                group: COMMAND_GROUPS.session,
                icon: <VisibilityOffIcon />,
                keywords: ["close", "clear", "hide", "deactivate", "all"],
                enabled: activeStudents.length > 0,
                run: () => setActiveStudents([]),
            },
        ],
        [refetchAllStudentInfo, activeStudents, setActiveStudents],
    );

    // A factory rather than an array: the roster runs to hundreds of students,
    // and two commands each is not a list worth materialising for an empty
    // query. The roster-wide actions above are always offered; the per-student
    // ones wait until something is typed, so the default list stays app
    // commands rather than the whole school.
    const source = useCallback(
        (query: CommandQuery) =>
            query.text.trim().length === 0
                ? rosterCommands
                : [
                      ...rosterCommands,
                      ...buildStudentCommands(
                          studentInfoList,
                          activeStudents,
                          toggleWatch,
                          openStandalone,
                      ),
                  ],
        [
            rosterCommands,
            studentInfoList,
            activeStudents,
            toggleWatch,
            openStandalone,
        ],
    );

    useCommands(source);

    return null;
}
