"use client";

import { useCallback, useMemo, useState } from "react";
import { useCurrentTags } from "@/components/current-tags-provider";
import { Tag, TagType, useKnownTags } from "@/components/known-tags-provider";
import SearchGlyph from "@/glyphs/search";
import { Tooltip, Typography } from "@mui/material";

function EnabledTag({ tag }: { tag: Tag }) {
    const { removeTag } = useCurrentTags();
    return (
        <Tooltip title={'Click to remove'} placement="top">
            <div
                className="bg-[#bb86fc] text-black px-2 py-1 rounded w-max cursor-pointer"
                onClick={() => removeTag(tag.name)}
            >
                <div className="flex flex-col items-end justify-around h-full">
                    <Typography fontSize={'1rem'} fontWeight={600} color="white">{tag.name}</Typography>
                    <div className="p-1 opacity-90 bg-[rgba(10,10,10,0.3)] rounded-sm w-min right-0 bottom-0">
                        <Typography fontSize={'0.5rem'} fontWeight={100} color="white">{tag.type.toLocaleString().toUpperCase()}</Typography>
                    </div>
                </div>
            </div>
        </Tooltip>
    );
}

export default function SearchFilterBar() {
    const { currentTags, addTag, removeLastTag } = useCurrentTags();
    const { knownTags } = useKnownTags();
    const [inputValue, setInputValue] = useState("");

    const [currentTagsItems, setCurrentTagsItems] = useState<Array<React.ReactNode>>([]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if ((event.key === "Tab" || event.key === "Enter") && inputValue.trim()) {
            addTag(inputValue);
            setInputValue("");
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "Backspace" && (!inputValue.trim())) {
            removeLastTag();
            event.preventDefault();
            event.stopPropagation();
        }
        else {
            console.log(event.key);
        }
    }, [inputValue, addTag, setInputValue, removeLastTag]);

    useMemo(() => {
        setCurrentTagsItems(currentTags.map((tag, index) => <EnabledTag key={`current-tag-${index}-${tag.name}`} tag={tag} />));
    }, [currentTags, setCurrentTagsItems]);

    const tagOptions = knownTags
        .filter((v) => v.students.length > 1) // Filter small/irrelevant groups
        .filter((v) => v.type !== TagType.Mentor) // Mentor names is obnocious
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((v, index) =>
            <option
                key={`tag-option-${index}-${v.name}`}
                onClick={() => addTag(v.name)}>
                {v.name}
            </option>
        );
        
    return (
        <div className="border p-2 rounded-lg flex space-x-2 flex-wrap items-center">
            <SearchGlyph className="w-6 h-6" glyphTitle={""} data-static />
            <div className="flex gap-2 flex-wrap">
                {currentTagsItems}
            </div>
            <input
                type="text"
                className="outline-none grow"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Filters..."
                list="tag-data-list"
            />
            <datalist id="tag-data-list">
                {tagOptions}
            </datalist>
        </div>
    );
}
