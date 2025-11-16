'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { enqueueApiErrorSnackbar } from "@/components/snackbar-utils";
import { useAllStudentInfo } from "@/components/all-student-info-provider";
import { useAuth } from "./auth-provider";

export type StudentInfo = {
    studentNumber: number;
    studentUsername: string;
    studentName: string;
    studentFirstName: string;
    studentLastName: string;
    studentStatus: string;
    currentExerciseName: string;
    currentExerciseUrl: string;
    currentExerciseId: number,
    currentExerciseParentModuleId: number,
    currentExerciseParentModuleParentSubjectId: number,
    checkersBrief: string;
    mentorFirstName: string;
    mentorLastName: string;
    mentorUsername: string;
    programName: string;
    hiveId: number;
    hostname: string;
};
export type StudentInfoContext = {
    default: boolean;
    mentorName: string;
} & StudentInfo;

const StudentInfoContextProvider = createContext<StudentInfoContext>({
    default: true,
    studentNumber: 0,
    studentUsername: '',
    studentName: '',
    studentFirstName: '',
    studentLastName: '',
    studentStatus: '',
    currentExerciseName: '',
    currentExerciseUrl: '',
    currentExerciseId: 0,
    currentExerciseParentModuleId: 0,
    currentExerciseParentModuleParentSubjectId: 0,
    checkersBrief: '',
    mentorFirstName: '',
    mentorUsername: '',
    mentorLastName: '',
    mentorName: '',
    programName: '',
    hiveId: 0,
    hostname: '',
});

export const StudentInfoProvider = ({
    children,
    studentUsername,
}: { children: React.ReactNode; studentUsername: string; }) =>
{
    const { clientEnvConfig } = useAuth();
    const { getStudentInfo } = useAllStudentInfo();

    const [ studentName, setStudentName ] = useState<string>('');
    const [ studentFirstName, setStudentFirstName ] = useState<string>('');
    const [ studentLastName, setStudentLastName ] = useState<string>('');
    const [ studentStatus, setStudentStatus ] = useState<string>('');
    const [ currentExerciseName, setCurrentExerciseName ] = useState<string>('');
    const [ currentExerciseUrl, setCurrentExerciseUrl ] = useState<string>('');
    const [ checkersBrief, setCheckersBrief ] = useState<string>('');
    const [ mentorFirstName, setMentorFirstName ] = useState<string>('');
    const [ mentorLastName, setMentorLastName ] = useState<string>('');
    const [ mentorName, setMentorName ] = useState<string>('');
    const [ mentorUsername, setMentorUsername ] = useState<string>('');
    const [ programName, setProgramName ] = useState<string>('');
    const [ hostname, setHostname ] = useState<string>('');
    const [ hiveId, setHiveId ] = useState<number>(0);
    const [ studentNumber, setStudentNumber ] = useState<number>(0);

    const [ currentExerciseId, setCurrentExerciseId ] = useState<number>(0);
    const [ currentExerciseParentModuleId, setCurrentExerciseParentModuleId ] = useState<number>(0);
    const [ currentExerciseParentModuleParentSubjectId, setCurrentExerciseParentModuleParentSubjectId ] = useState<number>(0);

    useEffect(() =>
    {
        if (!studentUsername) { return; }
        getStudentInfo(studentUsername).then((data) =>
        {
            if (!data) { return; }
            setStudentFirstName(data.studentFirstName);
            setStudentLastName(data.studentLastName);
            setStudentStatus(data.studentStatus);
            setCurrentExerciseName(data.currentExerciseName);
            setCurrentExerciseId(data.currentExerciseId);
            setCurrentExerciseParentModuleId(data.currentExerciseParentModuleId);
            setCurrentExerciseParentModuleParentSubjectId(data.currentExerciseParentModuleParentSubjectId);
            setCurrentExerciseUrl(`https://${clientEnvConfig.HIVE_HOSTNAME}/course/${data.currentExerciseParentModuleParentSubjectId}/${data.currentExerciseParentModuleId}/${data.currentExerciseId}#${data.hiveId}`);
            setCheckersBrief(data.checkersBrief);
            setMentorName(`${data.mentorFirstName} ${data.mentorLastName}`);
            setMentorUsername(data.mentorUsername);
            setMentorFirstName(data.mentorFirstName);
            setMentorLastName(data.mentorLastName);
            setProgramName(data.programName);
            setHiveId(data.hiveId);
            setHostname(data.hostname);
            setStudentNumber(data.studentNumber);

        }).catch((error) =>
        {
            enqueueApiErrorSnackbar('Failed to fetch student info', error);
        }
        );
    }, [ studentUsername, clientEnvConfig, getStudentInfo, setStudentFirstName, setHostname, setCurrentExerciseId, setStudentLastName, setCurrentExerciseParentModuleId, setCurrentExerciseParentModuleParentSubjectId, setStudentStatus, setCurrentExerciseName, setCurrentExerciseUrl, setCheckersBrief, setMentorUsername, setHiveId, ]);

    useEffect(() =>
    {
        setStudentName(`${studentFirstName} ${studentLastName}`);
    }, [ studentFirstName, studentLastName, setStudentName ]);

    return (
        <StudentInfoContextProvider.Provider value={ {
            default: false,
            studentNumber,
            studentUsername,
            studentName,
            studentFirstName,
            studentLastName,
            studentStatus,
            currentExerciseName,
            currentExerciseUrl,
            currentExerciseId,
            currentExerciseParentModuleId,
            currentExerciseParentModuleParentSubjectId,
            checkersBrief,
            mentorName,
            mentorFirstName,
            mentorLastName,
            mentorUsername,
            programName,
            hiveId,
            hostname,
        } } >
            { children }
        </StudentInfoContextProvider.Provider>
    );
};

export function useStudentInfo()
{
    const context = useContext(StudentInfoContextProvider);
    if (context.default)
    {
        throw Error('useStudentInfo must be used inside StudentInfoProvider!');
    }
    return context;
}
