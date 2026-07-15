"use client";

import { useMemo, useContext, createContext, useCallback } from "react";

import { useKnownTags } from "@/components/known-tags-provider";
import { useQueryParams } from "@/components/query-params-provider";
import { Tag } from "@/shared-api/types";

export type KnownTagsContext = {
    default: boolean;
    currentTags: Array<Tag>;
    addTag: (tagName: string) => void;
    removeTag: (tagName: string) => void;
    removeLastTag: () => void;
};

const CurrentTagsContextProvider = createContext<KnownTagsContext>({
    default: true,
    currentTags: [],
    addTag: () => {},
    removeTag: () => {},
    removeLastTag: () => {},
});

export const CurrentTagsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { doesTagExists, resolveTag } = useKnownTags();
    const { filters, addFilter, removeFilter } = useQueryParams();

    const tags = useMemo(
        () => filters.filter(doesTagExists).map((v) => resolveTag(v) as Tag),
        [filters, doesTagExists, resolveTag],
    );

    const addTag = useCallback(
        (newTagName: string) => {
            newTagName = newTagName.trim();
            if (!doesTagExists(newTagName)) {
                throw Error(`Tag ${newTagName} is not recognized!`);
            }
            addFilter(newTagName.toLowerCase());
        },
        [doesTagExists, addFilter],
    );

    const removeTag = useCallback(
        (oldTagName: string) => removeFilter(oldTagName.toLowerCase()),
        [removeFilter],
    );
    const removeLastTag = useCallback(() => {
        if (filters.length === 0) {
            return;
        }
        removeTag(filters[filters.length - 1].toLowerCase());
    }, [filters, removeTag]);

    return (
        <CurrentTagsContextProvider.Provider
            value={{
                default: false,
                currentTags: tags,
                addTag,
                removeTag,
                removeLastTag,
            }}
        >
            {children}
        </CurrentTagsContextProvider.Provider>
    );
};

export function useCurrentTags() {
    const context = useContext(CurrentTagsContextProvider);
    if (context.default) {
        throw Error("useCurrentTags must be used inside CurrentTagsProvider!");
    }
    return context;
}
