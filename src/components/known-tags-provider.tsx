"use client";

import { useState, useContext, createContext, useMemo, useCallback } from "react";
import { useAllStudentInfo } from "@/components/all-student-info-provider";
import { useClasses } from "./classes-provider";
import { Tag, TagType } from "@/shared-api/types";

export type KnownTagsContext = {
    default: boolean;
    knownTags: Array<Tag>;
    doesTagExists: (tagName: string) => boolean;
    resolveTag: (tagName: string) => Tag | undefined;
};

const KnownTagsContextProvider = createContext<KnownTagsContext>({
    default: true,
    knownTags: [],
    doesTagExists: () => false,
    resolveTag: () => undefined,
});

export const KnownTagsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) =>
{
    const { studentInfoList } = useAllStudentInfo();
    const { classes } = useClasses();
    const [ tags, setTags ] = useState<Array<Tag>>([]);

    useMemo(() =>
    {
        const studentNameTags: Array<Tag> = studentInfoList
            .filter((s) => !!s.studentName)
            .map((s) =>
            {
                return {
                    name: s.studentName,
                    students: [ s.studentUsername ],
                    type: TagType.StudentName,
                };
            });
        const studentNumberTags: Array<Tag> = studentInfoList
            .filter((s) => typeof s.studentNumber === 'number')
            .map((s) =>
            {
                return {
                    name: s.studentNumber.toString(),
                    students: [ s.studentUsername ],
                    type: TagType.StudentNumber,
                };
            });

        const classTags: Array<Tag> = classes
            .filter((hiveClass) => typeof hiveClass.name === 'string')
            .map((hiveClass) =>
            {
                return {
                    name: hiveClass.name,
                    students: hiveClass.users,
                    type: (hiveClass.type === 'Room') ? TagType.Classroom : (hiveClass.type === 'Student Group' ? TagType.StudentGroup : TagType.Level),
                };
            });

        const mentors: Record<string, Tag> = {};
        studentInfoList
            .filter((s) => typeof s.mentorUsername === 'string')
            .forEach((s) =>
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
    }, [ studentInfoList, classes, setTags ]);

    const doesTagExists = useCallback((tagName: string) =>
    {
        return tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase());
    }, [ tags ]);

    const resolveTag = useCallback((tagName: string) =>
    {
        const filteredKnownTags = tags.filter((t) => t.name.toLowerCase() === tagName.toLowerCase());
        if (filteredKnownTags.length !== 1) { console.error(`Tag ${tagName} not uniquely found!`); return undefined; }
        return filteredKnownTags[ 0 ];
    }, [ tags ]);

    return (
        <KnownTagsContextProvider.Provider
            value={ {
                default: false,
                knownTags: tags,
                doesTagExists,
                resolveTag,
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
