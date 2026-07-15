"use client";

import { useMemo } from "react";

import { ClientOnlyDynamic as ClientOnly } from "@/app/(themed)/(post-auth)/client-only";
import { useActiveStudents } from "@/components/active-students-provider";
import { useAllStudentInfo } from "@/components/all-student-info-provider";
import { useCurrentTags } from "@/components/current-tags-provider";
import { Drawer } from "@/components/drawer";
import { VncGrid } from "@/components/vnc-grid";

export default function Home() {
    const { activeStudents } = useActiveStudents();
    const { studentInfoList } = useAllStudentInfo();
    const { currentTags } = useCurrentTags();

    const studentsInFilter = useMemo(() => {
        return studentInfoList
            .filter(
                (s) =>
                    // Filter by current tags
                    currentTags.length === 0 ||
                    currentTags.some((tag) =>
                        tag.students.includes(s.studentUsername),
                    ),
            )
            .map((s) => ({
                // Map to desired format
                isActive: activeStudents.includes(s.studentUsername),
                student: s,
            }))
            .sort((a, b) => a.student.studentNumber - b.student.studentNumber);
    }, [activeStudents, currentTags, studentInfoList]);

    const activeStudentsOutsideFilter = useMemo(() => {
        if (currentTags.length === 0) {
            return [];
        } // No students outside filter if no filter is applied

        return studentInfoList
            .filter((student) =>
                activeStudents.includes(student.studentUsername),
            ) // Only consider active students
            .filter(
                (s) =>
                    // Exclude those in the current filter
                    !currentTags.some((tag) =>
                        tag.students.includes(s.studentUsername),
                    ),
            )
            .map((s) => ({
                // Map to desired format
                isActive: true,
                student: s,
            }))
            .sort((a, b) => a.student.studentNumber - b.student.studentNumber);
    }, [activeStudents, currentTags, studentInfoList]);

    return (
        <div className="w-full h-full">
            <ClientOnly>
                <div className="flex">
                    <Drawer
                        activeStudentsOutsideFilter={
                            activeStudentsOutsideFilter
                        }
                        students={studentsInFilter}
                    />
                    <VncGrid />
                </div>
            </ClientOnly>
        </div>
    );
}
