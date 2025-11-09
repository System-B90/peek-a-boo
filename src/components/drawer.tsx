"use client";

import { Dispatch, SetStateAction, useCallback, useState } from "react";
import SearchFilterBar from "./search/search-bar";
import StudentsPanel from "@/components/students-panel";
import { StudentTileInfo } from "@/interfaces/student";
import MenuGlyph from "@/glyphs/menu";
import GuardianGlyph from "@/glyphs/guardian";
import SchoolGlyph from "@/glyphs/school";
import CheckAllGlyph from "@/glyphs/check-all";
import { Box } from "@mui/material";
import { useAuth } from "./auth-provider";
import { useCurrentTags } from "./current-tags-provider";

interface Props
{
    students: StudentTileInfo[];
    hiddenStudents: StudentTileInfo[];
    setActiveStudents: Dispatch<SetStateAction<Set<string>>>;
}

export default function Drawer({
    students,
    setActiveStudents,
    hiddenStudents,
}: Props)
{
    const { addTag } = useCurrentTags();
    const { username: mentorUsername } = useAuth();

    const [ isOpen, setIsOpen ] = useState(true);
    const [ allSelected, setAllSelected ] = useState<boolean>(false);

    const openClass = "flex-1 p-4";
    const closeClass = "p-4";

    const selectNone = useCallback(() =>
    {
        setActiveStudents(new Set(hiddenStudents.map((s) => s.student.studentUsername)));
    }, [ setActiveStudents, hiddenStudents ]);

    const selectAll = useCallback(() =>
    {
        setActiveStudents(new Set([ ...students, ...hiddenStudents ].map((s) => s.student.studentUsername)));
    }, [ setActiveStudents, students, hiddenStudents ]);

    const toggleSelectAll = useCallback(() =>
    {
        if (allSelected)
        {
            selectNone();
        } else
        {
            selectAll();
        }

        setAllSelected(v => !v);
    }, [ allSelected, setAllSelected, selectAll, selectNone ]);

    const toggleOpen = useCallback(() =>
    {
        setIsOpen(v => !v);
    }, [ setIsOpen ]);

    const selectPrivateMentees = useCallback(() =>
    {
        addTag(mentorUsername);
    }, [ mentorUsername, addTag ]);

    return (
        <>
            <div
                className={ `bg-[#383838] h-screen rounded-r-xl border-r-[5px] border-[#bb86fc] transition-all duration-100 flex flex-col space-y-3 ${isOpen ? openClass : closeClass
                    }` }
            >
                <MenuGlyph className="w-8 h-8" glyphTitle={ "Toggle Menu" } placement="right" onClick={ toggleOpen } />

                { isOpen && <SearchFilterBar /> }
                { isOpen &&
                    <div className="flex justify-between">
                        <div className="flex flex-row">
                            <GuardianGlyph className="w-8 h-8" glyphTitle={ "Show Mentees" } placement="bottom" onClick={ selectPrivateMentees } />
                            <Box sx={ { width: '0.3rem' } } />
                            <SchoolGlyph className="w-8 h-8" glyphTitle={ "RESERVED" } placement="bottom" onClick={ undefined } />
                        </div>
                        <div className="flex flex-row">
                            <Box sx={ { width: '0.3rem' } } />
                            <CheckAllGlyph className="w-8 h-8" glyphTitle={ allSelected ? "Deselect All" : "Select All" } placement="bottom" onClick={ toggleSelectAll } />
                        </div>
                    </div>
                }
                { isOpen && (
                    <StudentsPanel
                        students={ students }
                        hiddenStudents={ hiddenStudents }
                        setActiveStudents={ setActiveStudents }
                    />
                ) }
            </div>
        </>
    );
}
