"use client";

import { useState, useEffect, useContext, createContext, useCallback } from "react";
import { enqueueApiErrorSnackbar } from "./snackbar-utils";
import { HiveClass, RawHiveClass } from "@/shared-api/types";
import { queryHiveClasses } from "@/client-api/classes";
import assert from "assert";
import { useAllStudentInfo } from "./all-student-info-provider";

export type ClassesContext = {
    default: boolean;
    classes: Array<HiveClass>;
};

const ClassesContextProvider = createContext<ClassesContext>({
    default: true,
    classes: [],
});

export const ClassesProvider = ({
    children,
}: {
    children: React.ReactNode;
}) =>
{
    const [ classes, setClasses ] = useState<Array<HiveClass>>([]);
    const { getStudentInfoByHiveId } = useAllStudentInfo();

    const rawHiveClassToClass = useCallback((rawClass: RawHiveClass): HiveClass =>
    {
        const classType = rawClass.type;
        assert([ 'Room', 'Student Group', 'Level' ].includes(classType), `Class type ${classType} is not recognized!`);
        return {
            id: rawClass.id,
            name: rawClass.name,
            displayName: rawClass.display_name,
            program: rawClass.program,
            users: rawClass.users.map((userId) =>
                getStudentInfoByHiveId(userId)?.studentUsername
            ),
            email: rawClass.email,
            type: classType as HiveClass[ 'type' ],
            programName: rawClass.program__name,
            description: rawClass.description,
        };
    }, [ getStudentInfoByHiveId ]);

    useEffect(() =>
    {
        queryHiveClasses()
            .then((rawClasses) =>
            {
                setClasses(rawClasses.map((rawClass) => rawHiveClassToClass(rawClass)));
            })
            .catch((error) =>
            {
                enqueueApiErrorSnackbar("Failed to fetch classes info!", error);
            });
    }, [ setClasses, rawHiveClassToClass ]);

    return (
        <ClassesContextProvider.Provider
            value={ {
                default: false,
                classes,
            } }
        >
            { children }
        </ClassesContextProvider.Provider>
    );
};

export function useClasses()
{
    const context = useContext(ClassesContextProvider);
    if (context.default)
    {
        throw Error(
            "useClasses must be used inside ClassesProvider!"
        );
    }
    return context;
}
