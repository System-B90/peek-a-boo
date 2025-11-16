"use client";

import { useState, useEffect, useContext, createContext, useCallback } from "react";
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
    addTag: () => { },
    removeTag: () => { },
    removeLastTag: () => { },
});

export const CurrentTagsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) =>
{
    const [ tags, setTags ] = useState<Array<Tag>>([]);
    const { knownTags } = useKnownTags();
    const { filters, addFilter, removeFilter } = useQueryParams();

    const doesTagExists = useCallback((tagName: string) =>
    {
        for (const tag of knownTags)
        {
            if (tag.name === tagName) return true;
        }
        return false;
    }, [ knownTags ]);

    const resolveTag = useCallback((tagName: string) =>
    {
        const filteredKnownTags = knownTags.filter((t) => t.name === tagName);
        if (filteredKnownTags.length !== 1) { console.error(`Tag ${tagName} not uniquely found!`); return undefined; }
        return filteredKnownTags[ 0 ];
    }, [ knownTags ]);

    useEffect(() =>
    {
        setTags(filters
            .filter(doesTagExists)
            .map((v) => resolveTag(v) as Tag));
    }, [ filters, doesTagExists, resolveTag, setTags ]);

    const addTag = useCallback((newTagName: string) =>
    {
        newTagName = newTagName.trim();
        if (!doesTagExists(newTagName))
        {
            throw Error(`Tag ${newTagName} is not recognized!`);
        }
        addFilter(newTagName);
    }, [ doesTagExists, addFilter ]);

    const removeTag = useCallback((oldTagName: string) => removeFilter(oldTagName), [ removeFilter ]);
    const removeLastTag = useCallback(() => removeTag(filters[ filters.length - 1 ]), [ filters, removeTag ]);

    return (
        <CurrentTagsContextProvider.Provider
            value={ {
                default: false,
                currentTags: tags,
                addTag, removeTag, removeLastTag,
            } }
        >
            { children }
        </CurrentTagsContextProvider.Provider>
    );
};

export function useCurrentTags()
{
    const context = useContext(CurrentTagsContextProvider);
    if (context.default)
    {
        throw Error(
            "useCurrentTags must be used inside CurrentTagsProvider!"
        );
    }
    return context;
}
