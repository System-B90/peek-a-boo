"use client";

import ClientOnly from "./client-only";
import VncGrid from "@/components/vnc-grid";
import Drawer from "@/components/drawer";
import { useAllStudentInfo } from "@/components/all-student-info-provider";
import { useEffect, useState } from "react";
import { useActiveStudents } from "@/components/active-students-provider";
import { useCurrentTags } from "@/components/current-tags-provider";
import { StudentInfo } from "@/components/student-info-provider";

export default function Home() {
    const { activeStudents, setActiveStudents } = useActiveStudents();
    const { studentInfo } = useAllStudentInfo();
    const { currentTags } = useCurrentTags();

    const [shownStudents, setShownStudents] = useState<Array<{ isActive: boolean; student: StudentInfo }>>([]);
    const [hiddenStudents, setHiddenStudents] = useState<Array<{ isActive: boolean; student: StudentInfo }>>([]);

    useEffect(() => {
        const filteredStudentNumbers = currentTags
            .map((t) => t.students)
            .reduce((a, b) => a.concat(b), []);

        const students = Object.values(studentInfo)
            .filter(
                (s) =>
                    filteredStudentNumbers.length === 0 ||
                    filteredStudentNumbers.includes(s.studentNumber)
            )
            .map((s) => {
                return {
                    isActive: activeStudents.has(s.studentNumber),
                    student: s,
                };
            });

        students.sort((a, b) => a.student.studentNumber - b.student.studentNumber);
        setShownStudents([...students]);
    }, [activeStudents, currentTags, studentInfo, setShownStudents]);

    useEffect(() => {
        const filteredStudentNumbers = currentTags
            .map((t) => t.students)
            .reduce((a, b) => a.concat(b), []);

        if (filteredStudentNumbers.length <= 0) return;

        const students = Object.values(studentInfo)
            .filter(
                (s) =>
                    !filteredStudentNumbers.includes(s.studentNumber) &&
                    activeStudents.has(s.studentNumber)
            )
            .map((s) => {
                return {
                    isActive: activeStudents.has(s.studentNumber),
                    student: s,
                };
            });

        students.sort((a, b) => a.student.studentNumber - b.student.studentNumber);
        setHiddenStudents([...students]);
    }, [activeStudents, currentTags, studentInfo, setHiddenStudents]);

    return (
        <div className="w-full h-full">
            <ClientOnly>
                <div className="flex">
                    <Drawer
                        students={shownStudents}
                        hiddenStudents={hiddenStudents}
                        setActiveStudents={setActiveStudents}
                    />
                    <VncGrid
                        activeUsers={activeStudents}
                        setActiveStudents={setActiveStudents}
                    />
                </div>
            </ClientOnly>
        </div>
    );
}
