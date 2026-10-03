import {
    Assignment,
    classifyHiveNetworkError,
    Clearance,
    CourseUser,
    createHiveServiceClient,
    Exercise,
    HiveClient,
} from "@system-b90/hive-core";

import { getSetting } from "@/server-api/settings";

/**
 * One roster row, in the shape the client has always consumed (it used to be
 * the column list of a SQL join over Hive's private tables).
 */
export type StudentRow = {
    mentorFirstName: null | string;
    mentorLastName: null | string;
    mentorUsername: null | string;
    studentUsername: string;
    studentNumber: null | number;
    studentFirstName: string;
    studentLastName: string;
    checkersBrief: string;
    studentStatus: string;
    hiveId: number;
    hostname: string;
    queueName: null | string;
    programName: string;
    currentExerciseName: null | string;
    currentExerciseId: null | number;
    currentExerciseParentModuleId: null | number;
    currentExerciseParentModuleParentSubjectId: null | number;
};

async function getHiveClient(): Promise<HiveClient> {
    return await createHiveServiceClient({
        username: await getSetting("HIVE_API_USERNAME"),
        password: await getSetting("HIVE_API_PASSWORD"),
        hiveBaseUrl: `https://${await getSetting("HIVE_HOSTNAME")}`,
    });
}

/** Fetches each distinct id once, in parallel; a failed lookup maps to nothing. */
async function fetchByIds<T>(
    ids: Iterable<null | number | undefined>,
    fetchOne: (id: number) => Promise<T>,
): Promise<Map<number, T>> {
    const unique = [...new Set(ids)].filter(
        (id): id is number => typeof id === "number",
    );
    const entries = await Promise.all(
        unique.map(async (id) => {
            try {
                return [id, await fetchOne(id)] as const;
            } catch {
                return undefined;
            }
        }),
    );
    return new Map(entries.filter((entry) => entry !== undefined));
}

/**
 * The student roster, read through Hive's REST API as the configured service
 * account — so Hive's own permission checks apply, and no Hive database
 * credentials or network access are needed.
 * @param studentUsername Restrict the roster to this one student.
 */
export async function getStudents(
    studentUsername?: string,
): Promise<Array<StudentRow>> {
    try {
        const hive = await getHiveClient();
        const [users, programs, queues] = await Promise.all([
            hive.getUsers(),
            hive.getPrograms(),
            hive.getQueues(),
        ]);

        const usersById = new Map(users.map((user) => [user.id, user]));
        const programsById = new Map(programs.map((p) => [p.id, p.name]));
        const queuesById = new Map(queues.map((q) => [q.id, q.name]));

        // A student without a program was dropped by the old inner join.
        const students = users.filter(
            (user) =>
                user.clearance === Clearance.Hanich &&
                typeof user.program === "number" &&
                (!studentUsername || user.username === studentUsername),
        );

        const assignments = await fetchByIds<Assignment>(
            students.map((student) => student.current_assignment),
            (id) => hive.getAssignment(id),
        );
        const exercises = await fetchByIds<Exercise>(
            [...assignments.values()].map((a) => a.exercise),
            (id) => hive.getExercise(id),
        );

        return students.map((student) =>
            toRow(student, {
                mentor: student.mentor
                    ? usersById.get(student.mentor)
                    : undefined,
                exercise: exercises.get(
                    assignments.get(student.current_assignment ?? -1)
                        ?.exercise ?? -1,
                ),
                programName: programsById.get(student.program as number) ?? "",
                queueName: student.queue
                    ? (queuesById.get(student.queue) ?? null)
                    : null,
            }),
        );
    } catch (error: unknown) {
        throw classifyHiveNetworkError(error);
    }
}

function toRow(
    student: CourseUser,
    related: {
        mentor?: CourseUser;
        exercise?: Exercise;
        programName: string;
        queueName: null | string;
    },
): StudentRow {
    const { mentor, exercise } = related;
    return {
        mentorFirstName: mentor?.first_name ?? null,
        mentorLastName: mentor?.last_name ?? null,
        mentorUsername: mentor?.username ?? null,
        studentUsername: student.username,
        studentNumber: student.number ?? null,
        studentFirstName: student.first_name ?? "",
        studentLastName: student.last_name ?? "",
        checkersBrief: student.checkers_brief ?? "",
        studentStatus: student.status,
        hiveId: student.id,
        hostname: student.hostname ?? "",
        queueName: related.queueName,
        programName: related.programName,
        currentExerciseName: exercise?.name ?? null,
        currentExerciseId: exercise?.id ?? null,
        currentExerciseParentModuleId: exercise?.parent_module ?? null,
        currentExerciseParentModuleParentSubjectId:
            exercise?.parent_subject ?? null,
    };
}
