"use client";

import
{
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { queryAllStudentInfo, queryStudentInfo } from "@/client-api/students";
import { enqueueApiErrorSnackbar } from "@/components/snackbar-utils";
import { StudentInfo } from "./student-info-provider";

export type AllStudentInfoContext = {
    default: boolean;
    getStudentInfo: (
        username: string,
        forceRefetch?: boolean
    ) => Promise<StudentInfo>;
    studentInfoDict: Record<string, StudentInfo>;
    studentInfoList: Array<StudentInfo>;
    getStudentInfoByHiveId: (id: number) => StudentInfo;
    refetchAllStudentInfo: () => Promise<void>;
};

const AllStudentInfoContextProvider = createContext<AllStudentInfoContext>({
    default: true,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    getStudentInfo: async (_username: string) =>
    {
        return {
            studentNumber: 0,
            studentUsername: "",
            studentName: "",
            studentFirstName: "",
            studentLastName: "",
            studentStatus: "",
            currentExercise: "",
            checkersBrief: "",
            mentorName: "",
            mentorUsername: "",
            mentorFirstName: "",
            mentorLastName: "",
            currentExerciseId: 0,
            currentExerciseName: '',
            currentExerciseParentModuleId: 0,
            currentExerciseParentModuleParentSubjectId: 0,
            currentExerciseUrl: '',
            programName: "",
            hiveId: 0,
            hostname: '',
        };
    },
    studentInfoDict: {},
    studentInfoList: [],
    getStudentInfoByHiveId: () =>
    {
        return {
            studentNumber: 0,
            studentUsername: "",
            studentName: "",
            studentFirstName: "",
            studentLastName: "",
            studentStatus: "",
            currentExercise: "",
            checkersBrief: "",
            mentorName: "",
            mentorUsername: "",
            mentorFirstName: "",
            mentorLastName: "",
            programName: "",
            currentExerciseId: 0,
            currentExerciseName: '',
            currentExerciseParentModuleId: 0,
            currentExerciseParentModuleParentSubjectId: 0,
            currentExerciseUrl: '',
            hiveId: 0,
            hostname: '',
        };
    },
    refetchAllStudentInfo: async () => { },
});

export const AllStudentInfoProvider = ({
    children,
}: {
    children: React.ReactNode;
}) =>
{
    const [ studentInfo, setStudentInfo ] = useState<Record<string, StudentInfo>>({});
    const studentInfoList = useMemo(() => Object.values(studentInfo), [ studentInfo ]);

    const getStudentInfo = useCallback(
        async (studentUsername: string, forceRefetch?: boolean) =>
        {
            if (!studentUsername) { throw new Error('Invalid student username!'); }

            if (forceRefetch)
            {
                const newStudentInfo = { ...studentInfo };
                const queriedStudentInfo = await queryStudentInfo(
                    studentUsername
                );
                newStudentInfo[ studentUsername ] = queriedStudentInfo;
                setStudentInfo(newStudentInfo);
            }
            return studentInfo[ studentUsername ];
        },
        [ studentInfo, setStudentInfo ]
    );


    const getStudentInfoByHiveId = useCallback((hiveId: number) =>
    {
        return Object.values(studentInfo).filter((info) => info.hiveId === hiveId)[ 0 ];
    }, [ studentInfo ]);

    const refetchAllStudentInfo = useCallback(async () =>
    {
        return queryAllStudentInfo()
            .then((data) =>
            {
                setStudentInfo(
                    data.filter((item) => item.studentNumber !== undefined)
                        .reduce((acc, item) =>
                        {
                            acc[ item.studentUsername ] = {
                                ...item,
                                studentNumber: item.studentNumber,
                                studentName: `${item.studentFirstName} ${item.studentLastName}`,
                            };
                            return acc;
                        }, {} as Record<string, StudentInfo>)
                );
            })
            .catch((error) =>
            {
                enqueueApiErrorSnackbar("Failed to fetch all student's info", error);
            });
    }, [ setStudentInfo ]);

    useEffect(() =>
    {
        refetchAllStudentInfo();
    }, [ refetchAllStudentInfo ]);

    return (
        <AllStudentInfoContextProvider.Provider
            value={ {
                default: false,
                getStudentInfo,
                studentInfoDict: studentInfo,
                studentInfoList,
                getStudentInfoByHiveId,
                refetchAllStudentInfo,
            } }
        >
            { children }
        </AllStudentInfoContextProvider.Provider>
    );
};

export function useAllStudentInfo()
{
    const context = useContext(AllStudentInfoContextProvider);
    if (context.default)
    {
        throw Error(
            "useAllStudentInfo must be used inside AllStudentInfoProvider!"
        );
    }
    return context;
}
