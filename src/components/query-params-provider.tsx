"use client";

import
{
    useState,
    useEffect,
    useContext,
    createContext,
    useCallback,
    Dispatch,
    SetStateAction,
    useMemo,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const FILTER_QUERY_PARAM = "filter";
const ACTIVE_QUERY_PARAM = "active";

export type Filter = string;
export type Active = string;

export type QueryParamsContext = {
    default: boolean;

    initialized: boolean;

    filters: Array<Filter>;
    actives: Array<Active>;

    setFilters: Dispatch<SetStateAction<Array<Filter>>>;
    addFilter: (filter: Filter) => void;
    removeFilter: (filter: Filter) => void;

    setActives: Dispatch<SetStateAction<Array<Active>>>;
    addActive: (active: Active) => void;
    removeActive: (active: Active) => void;
};

const QueryParamsContextProvider = createContext<QueryParamsContext>({
    default: true,

    initialized: false,

    filters: [],
    actives: [],

    setFilters: () => { },
    addFilter: () => { },
    removeFilter: () => { },

    setActives: () => { },
    addActive: () => { },
    removeActive: () => { },
});

function arraysEqual(a: string[], b: string[])
{
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++)
    {
        if (a[ i ] !== b[ i ]) return false;
    }
    return true;
}

export const QueryParamsProvider = ({ children }: { children: React.ReactNode; }) =>
{
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [ initialized, setInitialized ] = useState(false);

    const [ filters, setFilters ] = useState<Array<Filter>>([]);
    const [ actives, setActives ] = useState<Array<Active>>([]);

    //
    // ---- Helpers ----
    //

    const parseCommaSeparated = useCallback((value: string | null): string[] =>
    {
        if (!value) return [];
        return value
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v.length > 0);
    }, []);

    const buildQueryParams = useCallback((newFilters: string[], newActives: string[]) =>
    {
        // Start with **clean** URLSearchParams to avoid infinite-loop dependencies
        const params = new URLSearchParams();
        if (newFilters.length > 0)
        {
            params.set(FILTER_QUERY_PARAM, newFilters.join(","));
        }
        if (newActives.length > 0)
        {
            params.set(ACTIVE_QUERY_PARAM, newActives.join(","));
        }
        return params;
    }, []);

    // stable serialized current search string derived from Next's searchParams
    const currentSearchString = useMemo(() => searchParams.toString(), [ searchParams ]);

    //
    // ---- React state -> URL (only if truly different) ----
    //
    useEffect(() =>
    {
        if (!initialized) { return; }

        const params = buildQueryParams(filters, actives);
        const desired = params.toString();

        // avoid adding a stray `?` when there are no params
        const desiredUrl = desired ? `${pathname}?${desired}` : pathname;

        // If serialized query strings equal, don't navigate
        if (desired === currentSearchString) { return; }

        // final safety: also avoid navigating to exactly the same full URL
        const currentFull = typeof window !== "undefined" ? window.location.pathname + (window.location.search || "") : null;
        if (currentFull === desiredUrl) { return; }

        // replace to keep single history entry
        router.replace(desiredUrl);
    }, [ initialized, filters, actives, buildQueryParams, router, pathname, currentSearchString ]);

    //
    // ---- URL -> React state (only update state if different values) ----
    //
    useEffect(() =>
    {
        const filterParamExists = searchParams.has(FILTER_QUERY_PARAM);
        const activeParamExists = searchParams.has(ACTIVE_QUERY_PARAM);

        const newFilters = parseCommaSeparated(searchParams.get(FILTER_QUERY_PARAM));
        const newActives = parseCommaSeparated(searchParams.get(ACTIVE_QUERY_PARAM));

        setFilters((prev) =>
            filterParamExists
                ? (arraysEqual(prev, newFilters) ? prev : newFilters)
                : prev // <-- do NOT overwrite when param absent
        );

        setActives((prev) =>
            activeParamExists
                ? (arraysEqual(prev, newActives) ? prev : newActives)
                : prev // <-- do NOT overwrite when param absent
        );

        setInitialized(true);
    }, [ searchParams, parseCommaSeparated, setActives, setFilters, setInitialized ]);

    //
    // ---- Public API ----
    //

    const addFilter = useCallback((filter: Filter) =>
    {
        setFilters((prev) =>
            prev.includes(filter) ? prev : [ ...prev, filter ]
        );
    }, [ setFilters ]);

    const removeFilter = useCallback((filter: Filter) =>
    {
        setFilters((prev) => prev.filter((f) => f !== filter));
    }, [ setFilters ]);

    const addActive = useCallback((active: Active) =>
    {
        setActives((prev) =>
            prev.includes(active) ? prev : [ ...prev, active ]
        );
    }, [ setActives ]);

    const removeActive = useCallback((active: Active) =>
    {
        setActives((prev) => prev.filter((a) => a !== active));
    }, [ setActives ]);

    return (
        <QueryParamsContextProvider.Provider
            value={ {
                default: false,

                initialized,

                filters,
                actives,

                setFilters,
                addFilter,
                removeFilter,

                setActives,
                addActive,
                removeActive,
            } }
        >
            { children }
        </QueryParamsContextProvider.Provider>
    );
};

export function useQueryParams()
{
    const context = useContext(QueryParamsContextProvider);
    if (context.default)
    {
        throw new Error("useQueryParams must be used inside QueryParamsProvider");
    }
    return context;
}
