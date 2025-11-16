"use client";

import { useState, useContext, createContext, useMemo } from "react";
import { useAllStudentInfo } from "@/components/all-student-info-provider";
import { useClasses } from "./classes-provider";
import { Tag, TagType } from "@/shared-api/types";

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
}) =>
{
    const [ tags, setTags ] = useState<Array<Tag>>([]);
    const { studentInfoDict: studentInfo } = useAllStudentInfo();
    const { classes } = useClasses();

    useMemo(() =>
    {
        const studentNameTags: Array<Tag> = Object.values(studentInfo).filter((s) => !!s.studentName).map((s) =>
        {
            return {
                name: s.studentName,
                students: [ s.studentUsername ],
                type: TagType.StudentName,
            };
        });
        const studentNumberTags: Array<Tag> = Object.values(studentInfo).map((s) =>
        {
            return {
                name: s.studentNumber.toString(),
                students: [ s.studentUsername ],
                type: TagType.StudentNumber,
            };
        });

        const classTags: Array<Tag> = classes.map((hiveClass) =>
        {
            return {
                name: hiveClass.name,
                students: hiveClass.users,
                type: (hiveClass.type === 'Room') ? TagType.Classroom : (hiveClass.type === 'Student Group' ? TagType.StudentGroup : TagType.Level),
            };
        });

        const mentors: Record<string, Tag> = {};
        Object.values(studentInfo).forEach((s) =>
        {
            if (!mentors[ s.mentorUsername ])
            {
                mentors[ s.mentorUsername ] = {
                    name: s.mentorUsername,
                    students: [],
                    type: TagType.Mentor,
                };
            }
            mentors[ s.mentorUsername ].students.push(s.studentUsername);
        });

        setTags([ ...Object.values(mentors), ...studentNameTags, ...studentNumberTags, ...classTags ]);
    }, [ studentInfo, classes, setTags ]);

    return (
        <KnownTagsContextProvider.Provider
            value={ {
                default: false,
                knownTags: tags,
            } }
        >
            { children }
        </KnownTagsContextProvider.Provider>
    );
};

export function useKnownTags()
{
    const context = useContext(KnownTagsContextProvider);
    if (context.default)
    {
        throw Error(
            "useKnownTags must be used inside KnownTagsProvider!"
        );
    }
    return context;
}
