"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    createContext,
    Dispatch,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

export type ActiveStudentsContext = {
    default: boolean;
    activeStudents: Set<number>;
    setActiveStudents: Dispatch<SetStateAction<Set<number>>>;
};

const KnownTagsContextProvider = createContext<ActiveStudentsContext>({
    default: true,
    activeStudents: new Set(),
    setActiveStudents: () => { },
});

export const ActiveStudentsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [activeStudents, setActiveStudents] = useState<Set<number>>(new Set());

    const createQueryString = useCallback((name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(name, value);
        return params.toString();
    }, [searchParams]);

    const setActiveUsersWrapper: Dispatch<SetStateAction<Set<number>>> = useCallback((newValue) => {
        const resolvedValue = new Set(
            typeof newValue === "function"
                ? (newValue as (prev: Set<number>) => Set<number>)(activeStudents)
                : newValue);

        setActiveStudents(resolvedValue);
        router.replace(
            pathname +
            "?" +
            createQueryString(
                "actives",
                [...resolvedValue].map((n) => n.toString()).join("\0")
            )
        );
    }, [router, createQueryString, pathname, setActiveStudents, activeStudents]);

    const getActivesByUrl = useCallback(() => {
        return new Set(searchParams.get("actives")
            ? [...(searchParams.get("actives")?.split("\0").map(Number) ?? [])]
            : []);
    }, [searchParams]);

    useEffect(() => {
        setActiveStudents(getActivesByUrl());
    }, [setActiveStudents, getActivesByUrl]);

    return (
        <KnownTagsContextProvider.Provider
            value={{
                default: false,
                activeStudents,
                setActiveStudents: setActiveUsersWrapper,
            }}
        >
            {children}
        </KnownTagsContextProvider.Provider>
    );
};

export function useActiveStudents() {
    const context = useContext(KnownTagsContextProvider);
    if (context.default) {
        throw Error(
            "useActiveStudents must be used inside ActiveStudentsProvider!"
        );
    }
    return context;
}
