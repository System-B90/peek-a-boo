import PeekabooIconGlyph from "@/glyphs/peekaboo-icon";
import { Box, Typography } from "@mui/material";
import { useState, useCallback, MouseEventHandler } from "react";
import { useAuth } from "./auth-provider";
import { useAllStudentInfo } from "./all-student-info-provider";
import RefreshGlyph from "@/glyphs/refresh";
import RecurringAppointmentExceptionGlyph from "@/glyphs/RecurringAppointmentException";
import { enqueueApiErrorSnackbar } from "./snackbar-utils";

function RefreshAllData() {
    const { refetchAllStudentInfo } = useAllStudentInfo();

    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);

    const refreshClickCallback: MouseEventHandler<HTMLDivElement> = useCallback((event) => {
        event.stopPropagation();
        event.preventDefault();

        setIsAnimating(true);
        setHasError(false);

        refetchAllStudentInfo().then(() => {
            setTimeout(() => {
                setIsAnimating(false);
            }, 750);
        })
            .catch((error) => {
                setIsAnimating(false);
                enqueueApiErrorSnackbar('Failed to fetch!', error);
                setHasError(true);
            });

    }, [refetchAllStudentInfo, setIsAnimating, setHasError]);

    return (
        <>
            {
                hasError ? (
                    <RecurringAppointmentExceptionGlyph
                        glyphTitle={"Failed to fetch!"}
                        onClick={refreshClickCallback}
                        className={`w-6 h-6 text-red-500`}
                        data-vnc-refresh-data={true}
                        data-animating={isAnimating}
                    />
                ) : (
                    <RefreshGlyph
                        data-vnc-refresh-data={true}
                        data-animating={isAnimating}
                        glyphTitle="Reload All"
                        className="w-6 h-6"
                        onClick={refreshClickCallback} />
                )
            }
        </>
    );

}

export default function MentorAccessBar() {
    const { displayName } = useAuth();
    const [minimized, setMinimized] = useState<boolean>(false);

    const logoutCallback = useCallback(() => {
        if (typeof window === 'undefined') { return; }
        window.location.replace('/api/logout');
    }, []);

    const toggleMinimize = useCallback(() => {
        setMinimized(v => !v);
    }, [setMinimized]);

    return (
        <div className="absolute right-0 flex flex-col justify-end">
            <div className={`flex items-start flex-row`} data-static>
                <div
                    className={`relative cursor-pointer flex items-center flex-row rounded-[0px_0px_0px_1rem] bg-[#bb86fc] p-4 z-10 transition-all ${minimized ? 'transform-[translateX(calc(100%_-_4rem))]' : 'transform-[translateX(0)]'}`}
                    dir="rtl"
                    onClick={toggleMinimize}
                >
                    <div className={`flex flex-col justify-end ${minimized ? 'height-[4rem]' : 'height-[8rem]'}`}>
                        <div className="flex items-center flex-row">
                            <Box sx={{ width: '2rem', height: '2rem' }} />
                            <div className={`flex items-center flex-row ${minimized ? 'transform-[translateX(calc(100%))]' : 'transform-[translateX(0)]'}`} data-static>
                                <Box sx={{ width: '0.3rem' }} />
                                <Typography fontSize={'0.8rem'} fontWeight={600}>{displayName}</Typography>
                            </div>
                        </div>
                        <div className={`flex flex-row items-center justify-end ${minimized ? 'transform-[translateX(calc(100%))_translateY(-100%)]' : 'transform-[translateX(0)]'}`}>
                            <RefreshAllData />
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <PeekabooIconGlyph glyphTitle={"Logout"} className={`absolute transform-[translateX(-3rem)_translateY(1rem)] w-8 h-8 z-50`} onClick={logoutCallback} />
                </div>
            </div>

        </div>
    )
}
