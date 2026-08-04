import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback, MouseEventHandler } from "react";

import { useAllStudentInfo } from "@/components/all-student-info-provider";
import { CommandPaletteButton } from "@/components/app-commands/CommandPaletteButton";
import { useAuth } from "@/components/auth-provider";
import { enqueueApiErrorSnackbar } from "@/components/snackbar-utils";
import { HomeGlyph } from "@/glyphs/home";
import { PeekabooIconGlyph } from "@/glyphs/peekaboo-icon";
import { RecurringAppointmentExceptionGlyph } from "@/glyphs/RecurringAppointmentException";
import { RefreshGlyph } from "@/glyphs/refresh";
import { SettingsGlyph } from "@/glyphs/settings";

function RefreshAllData() {
    const { refetchAllStudentInfo } = useAllStudentInfo();

    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);

    const refreshClickCallback: MouseEventHandler<HTMLDivElement> = useCallback(
        (event) => {
            event.stopPropagation();
            event.preventDefault();

            setIsAnimating(true);
            setHasError(false);

            refetchAllStudentInfo()
                .then(() => {
                    setTimeout(() => {
                        setIsAnimating(false);
                    }, 750);
                })
                .catch((error) => {
                    setIsAnimating(false);
                    enqueueApiErrorSnackbar("Failed to fetch!", error);
                    setHasError(true);
                });
        },
        [refetchAllStudentInfo, setIsAnimating, setHasError],
    );

    return (
        <>
            {hasError ? (
                <RecurringAppointmentExceptionGlyph
                    className={`w-6 h-6 text-red-500`}
                    data-animating={isAnimating}
                    data-vnc-refresh-data={true}
                    glyphTitle={"Failed to fetch!"}
                    onClick={refreshClickCallback}
                />
            ) : (
                <RefreshGlyph
                    className="w-6 h-6"
                    data-animating={isAnimating}
                    data-vnc-refresh-data={true}
                    glyphTitle="Reload All"
                    onClick={refreshClickCallback}
                />
            )}
        </>
    );
}

function GotoSettings() {
    const pathname = usePathname();

    if (pathname === "/settings") {
        return (
            <Link href={"/"}>
                <HomeGlyph
                    className="w-6 h-6"
                    glyphTitle="Goto Home"
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                />
            </Link>
        );
    } else {
        return (
            <Link href={"/settings"}>
                <SettingsGlyph
                    className="w-6 h-6"
                    glyphTitle="Goto Settings"
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                />
            </Link>
        );
    }
}
export function MentorAccessBar() {
    const { displayName, showMentorAccessBar } = useAuth();
    const [minimized, setMinimized] = useState<boolean>(false);

    const logoutCallback = useCallback(() => {
        if (typeof window === "undefined") {
            return;
        }
        window.location.replace("/api/logout");
    }, []);

    const toggleMinimize = useCallback(() => {
        setMinimized((v) => !v);
    }, [setMinimized]);

    return (
        <div className="absolute right-0 flex flex-col justify-end">
            {showMentorAccessBar ? <div className={`flex items-start flex-row`} data-static>
                <div
                    className={`relative cursor-pointer flex items-center flex-row rounded-[0px_0px_0px_1rem] bg-[#bb86fc] p-4 z-10 transition-all ${minimized ? "transform-[translateX(calc(100%-4rem))]" : "transform-[translateX(0)]"}`}
                    dir="rtl"
                    onClick={toggleMinimize}
                >
                    <div
                        className={`flex flex-col justify-end ${minimized ? "height-[4rem]" : "height-[8rem]"}`}
                    >
                        <div className="flex items-center flex-row">
                            <Box sx={{ width: "2rem", height: "2rem" }} />
                            <div
                                className={`flex items-center flex-row ${minimized ? "transform-[translateX(calc(100%))]" : "transform-[translateX(0)]"}`}
                                data-static
                            >
                                <Box sx={{ width: "0.3rem" }} />
                                <Typography
                                    fontSize={"0.8rem"}
                                    fontWeight={600}
                                >
                                    {displayName}
                                </Typography>
                            </div>
                        </div>
                        <div
                            className={`flex flex-row items-center justify-end gap-x-1 ${minimized ? "transform-[translateX(calc(100%))_translateY(-100%)]" : "transform-[translateX(0)]"}`}
                        >
                            <CommandPaletteButton />
                            <GotoSettings />
                            <RefreshAllData />
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <PeekabooIconGlyph
                        className={`absolute transform-[translateX(-3rem)_translateY(1rem)] w-8 h-8 z-50`}
                        glyphTitle={"Logout"}
                        onClick={logoutCallback}
                    />
                </div>
            </div> : null}
        </div>
    );
}
