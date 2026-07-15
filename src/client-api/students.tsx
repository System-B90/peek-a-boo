import { safeApiFetcher } from "@/client-api/common-utils";
import { ClientApiError } from "@/shared-api/errors";
import { StudentInfo } from "@/shared-api/types";

export async function queryAllStudentInfo(): Promise<Array<StudentInfo>> {
    return (await queryStudentInfo()) as Array<StudentInfo>;
}

export async function queryStudentInfo(): Promise<Array<StudentInfo>>;
export async function queryStudentInfo(
    studentUsername: string,
): Promise<StudentInfo>;
export async function queryStudentInfo(
    studentUsername?: string,
): Promise<Array<StudentInfo> | StudentInfo>;

export async function queryStudentInfo(
    studentUsername?: string,
): Promise<Array<StudentInfo> | StudentInfo> {
    if (typeof studentUsername === "undefined" || !studentUsername) {
        const data = await safeApiFetcher(`/api/students`);
        return data as Array<StudentInfo>;
    }

    if (!studentUsername || studentUsername.length <= 0) {
        throw new ClientApiError("Invalid username!");
    }
    const data = await safeApiFetcher(`/api/students/${studentUsername}`);
    const studentsData = data as Array<StudentInfo>;
    if (studentsData.length < 1) {
        throw new ClientApiError("Student not found!");
    } else if (studentsData.length > 1) {
        throw new ClientApiError("Too many student usernames matched!");
    }
    return studentsData[0];
}
