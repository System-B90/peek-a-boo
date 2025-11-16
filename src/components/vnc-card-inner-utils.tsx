/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import "./vnc.css";

import { Box, TooltipProps, Typography } from "@mui/material";
import
{
    Dispatch,
    RefObject,
    SetStateAction,
    useCallback,
    useState,
} from "react";
import ExpandGlyph from "@/glyphs/Expand";
import CollapseGlyph from "@/glyphs/Collapse";
import ExternalLinkGlyph from "@/glyphs/ExternalLink";
import Link from "next/link";
import OnlineGlyph from "@/glyphs/Online";
import OfflineGlyph from "@/glyphs/Offline";
import WarningShieldGlyph from "@/glyphs/WarningShield";
import NaturalUserInterface2Glyph from "@/glyphs/NaturalUserInterface2";
import WallMountCameraGlyph from "@/glyphs/WallMountCamera";
import Grid from "@/glyphs/Grid";
import { useStudentInfo } from "./student-info-provider";
import TweetButton from "@/components/tweet-bot";
import { VncScreenHandle } from "react-vnc";
import
{
    displayIncludesCenterModule,
    VncCardDisplayState,
} from "./vnc-card-inner";
import RefreshGlyph from "@/glyphs/refresh";
import { useAllStudentInfo } from "./all-student-info-provider";
import RecurringAppointmentExceptionGlyph from "@/glyphs/RecurringAppointmentException";
import { enqueueApiErrorSnackbar } from "./snackbar-utils";
import PcOnDeskGlyph from "@/glyphs/pc-on-desk";
import { useAuth } from "@/components/auth-provider";

export type VncCardProps = {
    studentUsername: string;
    isFullscreen?: boolean;
    onClose?: (username: string) => void;
};

type TogglerGlyph = typeof ExpandGlyph;

function Toggler({
    value,
    setValue,
    className,
    onGlyph,
    offGlyph,
    onGlyphCaption,
    offGlyphCaption,
    ...props
}: {
    value: boolean;
    setValue: Dispatch<SetStateAction<boolean>>;
    className: string;
    onGlyph: TogglerGlyph;
    offGlyph: TogglerGlyph;
    onGlyphCaption: string;
    offGlyphCaption: string;
    placement?: TooltipProps[ "placement" ];
} & React.HTMLAttributes<HTMLDivElement>)
{
    const toggleExpansion = useCallback(() =>
    {
        setValue((v) => !v);
    }, [ setValue ]);

    return (
        <>
            { value
                ? onGlyph({
                    glyphTitle: onGlyphCaption,
                    className,
                    onClick: toggleExpansion,
                    ...props,
                })
                : offGlyph({
                    glyphTitle: offGlyphCaption,
                    className,
                    onClick: toggleExpansion,
                    ...props,
                }) }
        </>
    );
}

function Expander({
    isExpanded,
    setIsExpanded,
    className,
    ...props
}: {
    isExpanded: boolean;
    setIsExpanded: Dispatch<SetStateAction<boolean>>;
    className: string;
} & React.HTMLAttributes<HTMLDivElement>)
{
    return (
        <Toggler
            value={ isExpanded }
            setValue={ setIsExpanded }
            className={ className }
            onGlyph={ CollapseGlyph }
            offGlyph={ ExpandGlyph }
            onGlyphCaption={ "Collapse" }
            offGlyphCaption={ "Expand" }
            { ...props }
        />
    );
}

export function VncCardCenterModule()
{
    const { checkersBrief, mentorName, mentorUsername } = useStudentInfo();

    const placeholder = (
        <span
            style={ {
                direction: "rtl",
                opacity: 0.5,
                fontStyle: "italic",
            } }
        >
            מכוון בודק
        </span>
    );

    return (
        <div className="px-4">
            <div id="checkers-brief" className="rtl flex flex-row" dir="rtl">
                <div className="text-center flex flex-row-reverse" dir="rtl">
                    {
                        /* Mentor error message */
                        (!mentorName || !mentorUsername) && (
                            <Typography color="error" style={ { direction: "rtl" } }>
                                אין לחניך מפקד!
                            </Typography>
                        ) ||
                        /* Mentor name and link */
                        (
                            <Link
                                href={ `https://mattermost/eshel/messages/@${mentorUsername}` }
                                target="_blank"
                                className="hover:underline transition-all"
                            >
                                { mentorName }
                            </Link>
                        )
                    }
                    <Box sx={ { width: "0.3rem" } } />
                    {/* Checkers brief with inline placeholder */ }
                    <Typography>
                        &quot;
                        { checkersBrief ? checkersBrief : placeholder }
                        &quot; -
                    </Typography>
                </div>
            </div>
        </div>
    );
}


export function VncCardLeftModule()
{
    const { clientEnvConfig } = useAuth();
    const { studentNumber, studentName, currentExerciseUrl, currentExerciseName, hiveId } = useStudentInfo();

    return (
        <div className="flex flex-col min-w-[30%] -mt-2">
            <Link href={ `https://${clientEnvConfig.HIVE_HOSTNAME}/mentor/students?id=${hiveId}` }>
                <div className="flex flex-row items-center">
                    <div className="p-2 bg-secondary-light rounded-full w-8 h-8 flex flex-row items-center content-center justify-center text-center">
                        <Typography>{ studentNumber }</Typography>
                    </div>
                    <Box sx={ { width: "0.3rem" } } />
                    <Typography fontSize={ "1.2rem" } fontWeight={ 600 }>
                        { studentName }
                    </Typography>
                </div>
            </Link>
            <div className="ml-9">
                <Link href={ currentExerciseUrl }>
                    <Typography fontSize={ "0.8rem" }>{ currentExerciseName }</Typography>
                </Link>
            </div>
        </div>
    );
}

function RefreshData({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>)
{
    const { getStudentInfo } = useAllStudentInfo();
    const { studentUsername } = useStudentInfo();

    const [ isAnimating, setIsAnimating ] = useState<boolean>(false);
    const [ hasError, setHasError ] = useState<boolean>(false);

    const clickHandler = useCallback(() =>
    {
        setIsAnimating(true);
        setHasError(false);

        getStudentInfo(studentUsername, true)
            .then(() =>
            {
                setTimeout(() =>
                {
                    setIsAnimating(false);
                }, 750);
            })
            .catch((error) =>
            {
                setIsAnimating(false);
                enqueueApiErrorSnackbar('Failed to fetch!', error);
                setHasError(true);
            });
    }, [ studentUsername, setIsAnimating, setHasError, getStudentInfo ]);

    return (
        <>
            { hasError ? (
                <RecurringAppointmentExceptionGlyph
                    glyphTitle={ "Failed to fetch!" }
                    onClick={ clickHandler }
                    className={ `${className} text-red-500` }
                    data-vnc-refresh-data={ true }
                    data-animating={ isAnimating }
                    { ...props }
                />
            ) : (
                <RefreshGlyph
                    placement="right"
                    onClick={ clickHandler }
                    className={ className }
                    glyphTitle={ "Refresh data" }
                    data-vnc-refresh-data={ true }
                    data-animating={ isAnimating }
                    { ...props }
                />
            ) }
        </>
    );
}

export function VncRightModule({
    hasSecurityError,
    connected,
    displayState,
    desktopName,
    isViewOnly,
    setIsViewOnly,
    sideButtonClassnames,
    setDisplayState,
    studentUsername,
    vncRef,
}: {
    hasSecurityError: boolean;
    connected: boolean;
    displayState: VncCardDisplayState;
    desktopName: string;
    isViewOnly: boolean;
    setIsViewOnly: Dispatch<SetStateAction<boolean>>;
    sideButtonClassnames: string;
    setDisplayState: Dispatch<SetStateAction<VncCardDisplayState>>;
    studentUsername: string;
    vncRef: RefObject<VncScreenHandle | null>;
})
{
    const setIsVisible: Dispatch<SetStateAction<boolean>> = useCallback(
        (v) =>
        {
            setDisplayState((x) =>
            {
                if (x === VncCardDisplayState.Hidden)
                {
                    return VncCardDisplayState.Default;
                } else
                {
                    return VncCardDisplayState.Hidden;
                }
            });
        },
        [ setDisplayState ]
    );

    const setIsExpanded: Dispatch<SetStateAction<boolean>> = useCallback(
        (v) =>
        {
            setDisplayState((x) =>
            {
                switch (x)
                {
                    case VncCardDisplayState.Expanded:
                        return VncCardDisplayState.Default;
                    case VncCardDisplayState.Collapsed:
                    case VncCardDisplayState.Default:
                        return VncCardDisplayState.Expanded;
                    case VncCardDisplayState.Hidden:
                        return VncCardDisplayState.Hidden;
                    case VncCardDisplayState.Fullscreen:
                        return VncCardDisplayState.Fullscreen;
                    case VncCardDisplayState.Undefined:
                        return VncCardDisplayState.Undefined;
                }
            });
        },
        [ setDisplayState ]
    );

    return (
        <div className="flex flex-col">
            <div className="w-full flex flex-row-reverse -mt-2 mb-2 items-center">
                { !desktopName ?
                    <PcOnDeskGlyph
                        glyphTitle={ "Hostname Unknown!" }
                        className="w-5 h-5"
                        style={ { color: "var(--color-error)" } }
                    /> :
                    (
                        // Hostname known
                        hasSecurityError ? (
                            <WarningShieldGlyph
                                glyphTitle={ "Authentication Error!" }
                                className="w-5 h-5"
                                style={ { color: "var(--color-warning)" } }
                            />
                        ) : connected ? (
                            <OnlineGlyph
                                glyphTitle={ "Connected" }
                                className="w-5 h-5"
                                style={ { color: "var(--color-success)" } }
                            />
                        ) : (
                            <OfflineGlyph
                                glyphTitle={ "Disconnected" }
                                className="w-5 h-5"
                                style={ { color: "var(--color-error)" } }
                            />
                        )
                    ) }
                { displayIncludesCenterModule(displayState) && (
                    <>
                        <Box sx={ { width: "0.2rem" } } />
                        <Typography fontSize={ "0.7rem" }>{ desktopName }</Typography>
                    </>
                ) }
            </div>
            <div className="flex flex-row items-center content-center justify-center relative">
                {
                    connected && <div className="vnc-card-right-module flex flex-col items-center content-center justify-start z-10">
                        <RefreshData className={ sideButtonClassnames } />
                        <TweetButton vncRef={ vncRef } className={ sideButtonClassnames } />
                        <Toggler
                            value={ isViewOnly }
                            setValue={ setIsViewOnly }
                            className={ sideButtonClassnames }
                            onGlyph={ NaturalUserInterface2Glyph }
                            onGlyphCaption="Take Control"
                            offGlyph={ WallMountCameraGlyph }
                            offGlyphCaption="View Only"
                            placement={ "right" }
                        />
                    </div>
                }

                <Expander
                    isExpanded={ displayState === VncCardDisplayState.Expanded }
                    setIsExpanded={ setIsExpanded }
                    className={ sideButtonClassnames }
                    aria-disabled={ displayState === VncCardDisplayState.Fullscreen }
                />

                { displayState === VncCardDisplayState.Fullscreen ? (
                    <Link href={ `/` }>
                        <Grid className={ sideButtonClassnames } glyphTitle="Back to grid" />
                    </Link>
                ) : (
                    <Link href={ `/fullscreen?username=${studentUsername}` }>
                        <ExternalLinkGlyph
                            className={ sideButtonClassnames }
                            glyphTitle="Popout"
                        />
                    </Link>
                ) }
            </div>
        </div>
    );
}
