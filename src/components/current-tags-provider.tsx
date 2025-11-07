"use client";

import { useState, useEffect, useContext, createContext, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tag, useKnownTags } from "@/components/known-tags-provider";


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
}) => {
    const [tags, setTags] = useState<Array<Tag>>([]);
    const { knownTags } = useKnownTags();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createQueryString = useCallback((name: string, value: string) => {
        const params = new URLSearchParams(searchParams?.toString());
        params.set(name, value);
        return params.toString();
    }, [searchParams]);

    const doesTagExists = useCallback((tagName: string) => {
        for (const tag of knownTags) {
            if (tag.name === tagName) return true;
        }
        return false;
    }, [knownTags]);

    const getTag = useCallback((tagName: string) => {
        const filteredKnownTags = knownTags.filter((t) => t.name === tagName);
        if (filteredKnownTags.length !== 1) { console.error(`Tag ${tagName} not uniquely found!`); return undefined; }
        return filteredKnownTags[0];
    }, [knownTags]);

    const getTagsByUrl = useCallback(() => {
        return searchParams?.get("filter")
            ? [
                ...(searchParams
                    .get("filter")
                    ?.split("\0")
                    .filter(doesTagExists)
                    .map((v) => getTag(v) as Tag) ?? []),
            ]
            : []
    }, [searchParams, doesTagExists, getTag]);

    useEffect(() => {
        setTags(getTagsByUrl());
    }, [getTagsByUrl, setTags]);

    const addTag = useCallback((newTagName: string) => {
        newTagName = newTagName.trim();
        if (!doesTagExists(newTagName))
            throw Error(`Tag ${newTagName} is not recognized!`);

        router.replace(
            pathname +
            "?" +
            createQueryString(
                "filter",
                [...tags.map((t) => t.name), newTagName].join("\0")
            )
        );

        setTags([...tags, getTag(newTagName) as Tag]);
    }, [tags, router, pathname, setTags, createQueryString, doesTagExists, getTag]);

    const removeTag = useCallback((oldTagName: string) => {
        router.replace(
            pathname +
            "?" +
            createQueryString(
                "filter",
                tags
                    .map((t) => t.name)
                    .filter((t) => t !== oldTagName)
                    .join("\0")
            )
        );
        setTags(tags.filter((t) => t.name !== oldTagName));
    }, [tags, router, pathname, setTags, createQueryString]);

    const removeLastTag = useCallback(() => {
        setTags(v => { v.pop(); return v; })
    }, [setTags]);

    return (
        <CurrentTagsContextProvider.Provider
            value={{
                default: false,
                currentTags: tags,
                addTag, removeTag, removeLastTag,
            }}
        >
            {children}
        </CurrentTagsContextProvider.Provider>
    );
};

export function useCurrentTags() {
    const context = useContext(CurrentTagsContextProvider);
    if (context.default) {
        throw Error(
            "useCurrentTags must be used inside CurrentTagsProvider!"
        );
    }
    return context;
}
