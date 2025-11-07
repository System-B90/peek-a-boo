import { StudentTileInfo } from "@/interfaces/student";
import { Dispatch, SetStateAction, useCallback } from "react";
import StudentTile from "./student-tile";
import assert from "assert";

interface Props {
    students: StudentTileInfo[];
    hiddenStudents: StudentTileInfo[];
    setActiveStudents: Dispatch<SetStateAction<Set<number>>>;
}

export default function StudentsPanel({
    students,
    hiddenStudents,
    setActiveStudents,
}: Props) {
    const onClick = useCallback((number: number) => {
        const student = [...students, ...hiddenStudents].filter(
            (s) => s.student.studentNumber === number
        )[0];

        setActiveStudents((users) => {
            return new Set(student.isActive
                ? users.values().filter((s) => s !== number)
                : [...users, number]);
        });

    }, [students, hiddenStudents, setActiveStudents]);

    assert(students.every((v) => undefined === hiddenStudents.find((x) => x.student.studentNumber === v.student.studentNumber)), 'Overlap between hidden and non-hiddent students!');

    return (
        <div
            className="relative rounded-xl bg-[#121212] flex-grow p-2 space-y-3 overflow-y-scroll"
            style={{ scrollbarWidth: "none" }}
        >
            {[...students, ...hiddenStudents].map((tileInfo) => (
                <StudentTile
                    key={`student-tile-${tileInfo.student.studentUsername}-${tileInfo.student.hiveId}-${tileInfo.student.studentNumber}`}
                    student={tileInfo.student}
                    isActive={tileInfo.isActive}
                    onClick={onClick}
                    isInSearch={students.includes(tileInfo)}
                />
            ))}
        </div>
    );
}
