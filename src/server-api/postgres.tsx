/* eslint-disable @typescript-eslint/no-empty-object-type */
import { hiveErrorHandler } from "@/server-api/hive";
import { getSetting } from "@/server-api/settings";
import postgres, { Sql } from "postgres";

let pg: Sql<{}> | undefined;

async function getPostgres(): Promise<Sql<{}>>
{
    try
    {
        if (!pg)
        {
            pg = postgres({
                username: await getSetting('HIVE_POSTGRES_USERNAME'),
                password: await getSetting('HIVE_PASSWORD'),
                database: "core",
                host: await getSetting('HIVE_HOSTNAME'),
            });
        }
        return pg;
    } catch (error: unknown)
    {
        throw await hiveErrorHandler(error);
    }
}

const baseQuery = `SELECT
        mentor.first_name AS "mentorFirstName",
        mentor.last_name AS "mentorLastName",
        mentor.username AS "mentorUsername",
        mentee.username AS "studentUsername",
        mentee.number as "studentNumber",
        mentee.first_name AS "studentFirstName",
        mentee.last_name AS "studentLastName",
        mentee.checkers_brief AS "checkersBrief",
        mentee.status AS "studentStatus",
        mentee.id AS "hiveId",
        mentee.hostname AS "hostname",
        queues_queue.name AS "queueName",
        course_program.name AS "programName",
        course_exercise.name AS "currentExerciseName",
        course_exercise.id AS "currentExerciseId",
        course_exercise.parent_module_id AS "currentExerciseParentModuleId",
        course_module.parent_subject_id AS "currentExerciseParentModuleParentSubjectId"
    FROM management_courseuser AS mentee
        LEFT JOIN management_courseuser AS mentor ON mentee.mentor_id = mentor.id
        LEFT JOIN assignments_assignment ON assignments_assignment.id = mentee.current_assignment_id
        LEFT JOIN course_exercise ON course_exercise.id = assignments_assignment.exercise_id
        LEFT JOIN course_module ON course_module.id = course_exercise.parent_module_id
        LEFT JOIN course_subject ON course_subject.id = course_module.parent_subject_id
        JOIN course_program ON course_program.id = mentee.program_id
        LEFT JOIN queues_queue ON queues_queue.id = mentee.queue_id
    WHERE mentee.clearance = 1
`;

export async function queryPostgres(studentUsername?: string): Promise<unknown>
{
    try
    {
        const sql = await getPostgres();

        if (studentUsername)
        {
            return await sql.unsafe(`${baseQuery} AND mentee.username = '${studentUsername}'`);
        }

        return await sql.unsafe(baseQuery);
    } catch (error: unknown)
    {
        throw await hiveErrorHandler(error);
    }
}
