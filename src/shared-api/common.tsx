import { ClientEnvConfig } from "@/components/auth-provider";

export function studentUsernameBuilder(clientEnvConfig: ClientEnvConfig, studentNumber: number): string {
    return `${clientEnvConfig.STUDENT_USERNAME_PREFIX}${studentNumber}`
};

export function studentHostnameBuilder(clientEnvConfig: ClientEnvConfig, studentNumber: number, studentHostname: string | null): string {
    if (studentHostname) { return studentHostname; }
    return `${clientEnvConfig.STUDENT_USERNAME_PREFIX}${studentNumber}`
};

export function studentHostnameDestructor(clientEnvConfig: ClientEnvConfig, studentHostname: string): number {
    return parseInt(studentHostname.replace(clientEnvConfig.STUDENT_USERNAME_PREFIX ?? '', ''));
}
