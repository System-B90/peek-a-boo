
export namespace Api {
    export namespace Request {}
    export namespace Response {}
}

export type ApiResponseJson = {
    status: number;
    data?: unknown;
    error?: unknown;
}

export type StudentInfo = {
    studentNumber: number;
    studentUsername: string;
    studentName: string;
    studentFirstName: string;
    studentLastName: string;
    studentStatus: string;
    currentExerciseName: string;
    currentExerciseUrl: string;
    currentExerciseId: number;
    currentExerciseParentModuleId: number;
    currentExerciseParentModuleParentSubjectId: number;
    checkersBrief: string;
    mentorFirstName: string;
    mentorLastName: string;
    mentorUsername: string;
    programName: string;
    hiveId: number;
    hostname: string;
}

export type RawHiveClass = {
    id: number;
    name: string;
    display_name: string;
    program: number;
    users: Array<number>;
    email: string;
    type: string;
    program__name: string;
    description: string;
}

export type HiveClass = {
    id: number;
    name: string;
    displayName: string;
    program: number;
    users: Array<string>; // Student usernames
    email: string;
    type: "Level" | "Room" | "Student Group";
    programName: string;
    description: string;
}

export enum TagType {
    Unknown = 0,
    Mentor = "mentor",
    Classroom = "classroom",
    StudentGroup = "group",
    Level = "level",
    StudentName = "name",
    StudentNumber = "number",
}

export type Tag = {
    name: string;
    type: TagType;
    students: Array<string>; // Student usernames
}
