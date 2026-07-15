"use client";

import { createContext, useContext, useMemo } from "react";

import { useQueryParams } from "@/components/query-params-provider";

export type ActiveStudentsContext = {
    default: boolean;
    activeStudents: Array<string>;
    setActiveStudents: (students: Array<string>) => void;
    addActive: (username: string) => void;
    removeActive: (username: string) => void;
};

const ActiveStudentsContextProvider = createContext<ActiveStudentsContext>({
    default: true,
    activeStudents: [],
    setActiveStudents: () => {},
    addActive: () => {},
    removeActive: () => {},
});

export const ActiveStudentsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { actives, setActives, addActive, removeActive } = useQueryParams();
    const activeStudents = useMemo(() => actives, [actives]);

    return (
        <ActiveStudentsContextProvider.Provider
            value={{
                default: false,
                activeStudents,
                setActiveStudents: setActives,
                addActive,
                removeActive,
            }}
        >
            {children}
        </ActiveStudentsContextProvider.Provider>
    );
};

export function useActiveStudents() {
    const context = useContext(ActiveStudentsContextProvider);
    if (context.default) {
        throw Error(
            "useActiveStudents must be used inside ActiveStudentsProvider!",
        );
    }
    return context;
}
