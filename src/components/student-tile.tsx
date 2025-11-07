import { StudentTileInfo } from "@/interfaces/student";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { useCallback } from "react";
import { ApolloLogo, HermonLogo, MivtzarLogo } from "./course-logos";

interface Props extends StudentTileInfo {
    onClick: (number: number) => void;
    isInSearch: boolean;
}

export default function StudentTile({
    student,
    isActive,
    onClick,
    isInSearch,
}: Props) {

    const clickCallback = useCallback(() => {
        onClick(student.studentNumber);
    }, [student.studentNumber, onClick]);

    const programLogo = (
        (student.programName === 'Apollo') ? ApolloLogo
            : (student.programName === 'Hermon') ? HermonLogo
                : (student.programName === 'Mivtzar') ? MivtzarLogo
                    : MivtzarLogo);

    return (
        <div
            className={`h-[70px] flex-grow flex bg-[#bb86fc] rounded-2xl overflow-hidden relative cursor-pointer ${isInSearch ? "opacity-100" : "opacity-50"
                }`}
            dir="rtl"
            onClick={clickCallback}
        >
            <div className="bg-[#121212] aspect-[5/7] rounded-l-full flex justify-center items-center font-bold text-xl">
                <span className="ml-4"><Typography fontWeight={600} fontSize={'1.5rem'}>{student.studentNumber}</Typography></span>
            </div>
            <div className="flex flex-col bg-[#bb86fc] flex-grow text-black p-2">
                <div className="font-bold">
                    <Typography fontWeight={600}>
                        {student.studentFirstName} {student.studentLastName}
                    </Typography>
                </div>
                <div dir="rtl" className="flex flex-row items-center">
                    <Typography fontSize={'0.9rem'}>
                        {student.currentExerciseName}
                    </Typography>
                    <Box sx={{ width: '0.2rem' }} />
                    {programLogo({ 'className': 'w-6 h-6' })}
                </div>
            </div>
            <Image
                className="rounded-l-2xl h-[70px] aspect-sqare"
                src={`/api/image/${student.studentNumber}`}
                width={70}
                height={70}
                alt=""
            />
            <div
                className={`rounded-full bg-[#1afb1a] aspect-square w-[20px] absolute -left-[5px] -top-[5px] transition-all duration-200 ${isActive ? "opacity-100" : "opacity-0"
                    }`}
            ></div>
        </div>
    );
}
