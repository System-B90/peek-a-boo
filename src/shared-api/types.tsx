
/* eslint-disable @typescript-eslint/no-namespace */
namespace Api
{
    export namespace Request
    {
        export type LoginData = {
            username: string;
            password: string;
        };
    }
    export namespace Response
    {

    }
}

export default Api;

export interface ApiResponseJson
{
    status: number;
    data?: unknown;
    error?: unknown;
}


export interface RawHiveClass
{
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

export interface HiveClass
{
    id: number;
    name: string;
    displayName: string;
    program: number;
    users: Array<string>; // Student usernames
    email: string;
    type: 'Room' | 'Student Group' | 'Level';
    programName: string;
    description: string;
}


export enum TagType
{
    Unknown = 0,
    Mentor = 'mentor',
    Classroom = 'classroom',
    StudentGroup = 'group',
    Level = 'level',
    StudentName = 'name',
    StudentNumber = 'number',
};

export interface Tag
{
    name: string;
    type: TagType;
    students: Array<string>; // Student usernames
}

