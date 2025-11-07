"use client";

import { useState, useContext, createContext, useMemo } from "react";
import { useAllStudentInfo } from "@/components/all-student-info-provider";
import { useClasses } from "./classes-provider";

export enum TagType {
    Unknown = 0,
    Mentor = 'mentor',
    Classroom = 'classroom',
    StudentGroup = 'student group',
    Level = 'level',
    StudentName = 'student-name',
    StudentNumber = 'student-number',
};

export interface Tag {
    name: string;
    type: TagType;
    students: Array<number>;
}

export type KnownTagsContext = {
    default: boolean;
    knownTags: Array<Tag>;

};

const KnownTagsContextProvider = createContext<KnownTagsContext>({
    default: true,
    knownTags: [],
});

export const KnownTagsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [tags, setTags] = useState<Array<Tag>>([]);
    const { studentInfo } = useAllStudentInfo();
    const { classes } = useClasses();

    useMemo(() => {
        const studentNameTags: Array<Tag> = Object.values(studentInfo).filter((s) => !!s.studentName).map((s) => {
            return {
                name: s.studentName,
                students: [s.studentNumber],
                type: TagType.StudentName,
            };
        });
        const studentNumberTags: Array<Tag> = Object.values(studentInfo).map((s) => {
            return {
                name: s.studentNumber.toString(),
                students: [s.studentNumber],
                type: TagType.StudentNumber,
            };
        });

        const classTags: Array<Tag> = classes.map((hiveClass) => {
            return {
                name: hiveClass.name,
                students: hiveClass.users,
                type: (hiveClass.type === 'Room') ? TagType.Classroom : (hiveClass.type === 'Student Group' ? TagType.StudentGroup : TagType.Level),
            }
        })

        const mentors: Record<string, Tag> = {};
        Object.values(studentInfo).forEach((s) => {
            if (!mentors[s.mentorUsername]) {
                mentors[s.mentorUsername] = {
                    name: s.mentorUsername,
                    students: [],
                    type: TagType.Mentor,
                };
            }
            mentors[s.mentorUsername].students.push(s.studentNumber);
        });

        setTags([...Object.values(mentors), ...studentNameTags, ...studentNumberTags, ...classTags]);
    }, [studentInfo, classes, setTags]);

    return (
        <KnownTagsContextProvider.Provider
            value={{
                default: false,
                knownTags: tags,
            }}
        >
            {children}
        </KnownTagsContextProvider.Provider>
    );
};

export function useKnownTags() {
    const context = useContext(KnownTagsContextProvider);
    if (context.default) {
        throw Error(
            "useKnownTags must be used inside KnownTagsProvider!"
        );
    }
    return context;
}
