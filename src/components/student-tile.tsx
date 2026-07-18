import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useCallback } from "react";

import { ApolloLogo, HermonLogo, MivtzarLogo } from "@/components/course-logos";
import { StudentAvatar } from "@/components/student-avatar";
import { StudentTileInfo } from "@/interfaces/student";

type Props = {
    onClick: (username: string) => void;
    isInSearch: boolean;
} & StudentTileInfo

export function StudentTile({
    student,
    isActive,
    onClick,
    isInSearch,
}: Props) {
    const clickCallback = useCallback(() => {
        onClick(student.studentUsername);
    }, [student.studentUsername, onClick]);

    const programLogo =
        student.programName === "Apollo"
            ? ApolloLogo
            : student.programName === "Hermon"
                ? HermonLogo
                : student.programName === "Mivtzar"
                    ? MivtzarLogo
                    : MivtzarLogo;

    return (
        <div
            className={`min-h-[70px] flex-grow flex bg-[#bb86fc] overflow-clip relative cursor-pointer rounded-l-[1rem] ${
                isInSearch ? "opacity-100" : "opacity-50"
            }`}
            dir="rtl"
            onClick={clickCallback}
        >
            <div className="bg-[#121212] aspect-[5/7] rounded-l-full flex justify-center items-center font-bold text-xl overflow-hidden">
                <span className="ml-4">
                    <Typography fontSize={"1.5rem"} fontWeight={600}>
                        {student.studentNumber}
                    </Typography>
                </span>
            </div>
            <div className="flex flex-col bg-[#bb86fc] flex-grow text-black p-2">
                <div className="font-bold">
                    <Typography fontWeight={600}>
                        {student.studentFirstName} {student.studentLastName}
                    </Typography>
                </div>
                <div className="flex flex-row items-center" dir="rtl">
                    <Typography fontSize={"0.9rem"}>
                        {student.currentExerciseName}
                    </Typography>
                    <Box sx={{ width: "0.2rem" }} />
                    {programLogo({ className: "w-6 h-6" })}
                </div>
            </div>
            <StudentAvatar
                alt=""
                className="rounded-l-2xl h-full aspect-square"
                height={70}
                src={`/api/avatar/${student.hiveId}`}
                width={70}
            />
            <div
                className={`rounded-full bg-[#1afb1a] aspect-square w-[20px] absolute -left-[5px] -top-[5px] transition-all duration-200 ${
                    isActive ? "opacity-100" : "opacity-0"
                }`}
            ></div>
        </div>
    );
}

export function StudentTileSkeleton() {
    return (
        <div
            className={`h-[70px] flex-grow flex bg-[#bb86fc] overflow-clip relative cursor-pointer opacity-100 rounded-l-[1rem]`}
            dir="rtl"
        >
            <div className="bg-[#121212] aspect-[5/7] rounded-l-full flex justify-center items-center font-bold text-xl overflow-hidden">
                <span className="ml-4">
                    <Typography fontSize={"1.5rem"} fontWeight={600}>
                        0
                    </Typography>
                </span>
            </div>
            <div className="flex flex-col bg-[#bb86fc] flex-grow text-black p-2">
                <div className="font-bold">
                    <Skeleton variant="text" width={140} />
                </div>
                <div className="flex flex-row items-center" dir="rtl">
                    <Typography fontSize={"0.9rem"}>
                        <Skeleton variant="text" width={40} />
                    </Typography>
                    <Box sx={{ width: "0.2rem" }} />
                </div>
            </div>
            <Box
                className="rounded-l-2xl h-[70px] aspect-square relative overflow-hidden"
                height={70}
                width={70}
            >
                <div className="absolute inset-0 animate-pulse bg-purple-300 dark:bg-purple-700" />
            </Box>
            <div
                className={`rounded-full bg-[#1e1e1e] aspect-square w-[20px] absolute -left-[5px] -top-[5px] transition-all duration-200 opacity-50`}
            ></div>
        </div>
    );
}
