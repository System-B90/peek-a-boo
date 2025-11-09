"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import
{
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
    activeStudents: Set<string>;
    setActiveStudents: Dispatch<SetStateAction<Set<string>>>;
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
}) =>
{
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [ activeStudents, setActiveStudents ] = useState<Set<string>>(new Set());

    const createQueryString = useCallback((name: string, value: string) =>
    {
        const params = new URLSearchParams(searchParams.toString());
        params.set(name, value);
        return params.toString();
    }, [ searchParams ]);

    const setActiveUsersWrapper: Dispatch<SetStateAction<Set<string>>> = useCallback((newValue) =>
    {
        const resolvedValue = new Set(
            typeof newValue === "function"
                ? (newValue as (prev: Set<string>) => Set<string>)(activeStudents)
                : newValue);

        setActiveStudents(resolvedValue);
        router.replace(
            pathname +
            "?" +
            createQueryString(
                "actives",
                [ ...resolvedValue ].map((n) => n.toString()).join(",")
            )
        );
    }, [ router, createQueryString, pathname, setActiveStudents, activeStudents ]);

    const getActivesByUrl = useCallback(() =>
    {
        return new Set(searchParams.get("actives")
            ? [ ...(searchParams.get("actives")?.split(",").map(String) ?? []) ]
            : []);
    }, [ searchParams ]);

    useEffect(() =>
    {
        setActiveStudents(getActivesByUrl());
    }, [ setActiveStudents, getActivesByUrl ]);

    return (
        <KnownTagsContextProvider.Provider
            value={ {
                default: false,
                activeStudents,
                setActiveStudents: setActiveUsersWrapper,
            } }
        >
            { children }
        </KnownTagsContextProvider.Provider>
    );
};

export function useActiveStudents()
{
    const context = useContext(KnownTagsContextProvider);
    if (context.default)
    {
        throw Error(
            "useActiveStudents must be used inside ActiveStudentsProvider!"
        );
    }
    return context;
}
