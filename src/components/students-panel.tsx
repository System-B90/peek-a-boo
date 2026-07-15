import assert from "assert";

import { useCallback } from "react";

import { useActiveStudents } from "@/components/active-students-provider";
import { useQueryParams } from "@/components/query-params-provider";
import { StudentTile, StudentTileSkeleton } from "@/components/student-tile";
import { StudentTileInfo } from "@/interfaces/student";

type Props = {
    students: Array<StudentTileInfo>;
    activeStudentsOutsideFilter: Array<StudentTileInfo>;
}

export function StudentsPanel({
    students,
    activeStudentsOutsideFilter,
}: Props) {
    const { initialized: queryParamsInitialized } = useQueryParams();
    const { addActive, removeActive } = useActiveStudents();
    const onStudentTileClick = useCallback(
        (username: string) => {
            const shouldActivateUser =
                !students.find((s) => s.student.studentUsername === username)
                    ?.isActive &&
                !activeStudentsOutsideFilter.find(
                    (s) => s.student.studentUsername === username,
                )?.isActive;

            if (shouldActivateUser) {
                addActive(username);
                return;
            } else {
                removeActive(username);
                return;
            }
        },
        [students, activeStudentsOutsideFilter, addActive, removeActive],
    );

    assert(
        students.every(
            (v) =>
                undefined ===
                activeStudentsOutsideFilter.find(
                    (x) => x.student.studentNumber === v.student.studentNumber,
                ),
        ),
        "Overlap between hidden and non-hiddent students!",
    );

    return (
        <div
            className="relative rounded-xl bg-[#121212] flex-grow p-2 space-y-3 overflow-y-scroll"
            style={{ scrollbarWidth: "none" }}
        >
            {!queryParamsInitialized
                ? [...Array(5)].map((_, index) => (
                    <StudentTileSkeleton
                        key={`student-tile-skeleton-${index}`}
                    />
                ))
                : [...students, ...activeStudentsOutsideFilter].map(
                    (tileInfo) => (
                        <StudentTile
                            isActive={tileInfo.isActive}
                            isInSearch={students.includes(tileInfo)}
                            key={`student-tile-${tileInfo.student.studentUsername}-${tileInfo.student.hiveId}-${tileInfo.student.studentNumber}`}
                            onClick={onStudentTileClick}
                            student={tileInfo.student}
                        />
                    ),
                )}
        </div>
    );
}
