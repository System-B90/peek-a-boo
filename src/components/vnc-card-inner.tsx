"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { VncScreenHandle } from "react-vnc";

import {
    ClientVNC,
    VncDesktopNameEvent,
    VncCapabilitiesEvent,
} from "@/components/client-vnc";
import { SettingsProvider } from "@/components/settings-provider";
import { useStudentInfo } from "@/components/student-info-provider";
import {
    VncCardProps,
    VncCardLeftModule,
    VncCardCenterModule,
    VncRightModule,
    VncCardDisplayState,
    displayIncludesCenterModule,
} from "@/components/vnc-card-inner-utils";

export function VncCardInner({
    studentUsername,
    isFullscreen,
    onClose,
}: VncCardProps) {
    const { studentName, hostname: studentHostname } = useStudentInfo();
    const [connected, setConnected] = useState<boolean>(false);
    const [displayState, setDisplayState] = useState<VncCardDisplayState>(
        isFullscreen
            ? VncCardDisplayState.Fullscreen
            : VncCardDisplayState.Default,
    );
    const [isViewOnly, setIsViewOnly] = useState<boolean>(true);
    const [hasSecurityError, setHasSecurityError] = useState<boolean>(false);
    const FULLSCREEN_SCALE_FACTOR = 0.9;
    const SMALL_SCALE_FACTOR = 0.2;
    const [scaleFactor, setScaleFactor] = useState<number>(
        isFullscreen ? FULLSCREEN_SCALE_FACTOR : SMALL_SCALE_FACTOR,
    );

    const [width, setWidth] = useState<number>(1920 * scaleFactor);
    const [height, setHeight] = useState<number>(1200 * scaleFactor);
    const [, setDesktopName] = useState<string>(studentHostname);

    const vncRef = useRef<VncScreenHandle>(null);

    useEffect(() => {
        if (!isFullscreen) {
            return;
        }
        document.title = `${studentName} | Peek-a-Boo`;
    }, [isFullscreen, studentName]);

    const connectHandler = useCallback(() => {
        setConnected(true);
    }, [setConnected]);

    const disconnectHandler = useCallback(() => {
        setConnected(false);
    }, [setConnected]);

    const credentialRequiredHandler = useCallback(() => {
        setHasSecurityError(true);
    }, []);

    const securityFailureHandler = useCallback(() => {
        setHasSecurityError(true);
    }, [setHasSecurityError]);

    const desktopNameHandler = useCallback(
        (event: VncDesktopNameEvent) => {
            console.log(event.detail.name);
            setDesktopName(event.detail.name);
        },
        [setDesktopName],
    );

    const capabilitiesHandler = useCallback((event: VncCapabilitiesEvent) => {
        console.log("Capabilities", event);
    }, []);

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- Hidden intentionally keeps the previous scaleFactor (sticky), so this can't be a pure derivation of displayState */
        switch (displayState) {
        case VncCardDisplayState.Default:
            setScaleFactor(SMALL_SCALE_FACTOR);
            break;
        case VncCardDisplayState.Expanded:
            setScaleFactor(SMALL_SCALE_FACTOR * 2);
            break;
        case VncCardDisplayState.Collapsed:
            setScaleFactor(0);
            break;
        case VncCardDisplayState.Hidden:
            break;
        case VncCardDisplayState.Fullscreen:
            setScaleFactor(FULLSCREEN_SCALE_FACTOR);
            break;
        case VncCardDisplayState.Undefined:
            break;
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [displayState, setScaleFactor]);

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- width/height intentionally lag scaleFactor by one render for a smooth CSS transition */
        setWidth(1920 * scaleFactor);
        setHeight(1080 * scaleFactor);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [scaleFactor, setWidth, setHeight]);

    const sideButtonClassnames = "w-6 h-6 m-1";

    return (
        <div>
            <div
                className={`${isFullscreen ? "m-0" : "m-4"} bg-secondary-dark pt-2 rounded-xl shadow-2xl transition-all vnc-card`}
                data-is-expanded={
                    displayState === VncCardDisplayState.Expanded ||
                    displayState === VncCardDisplayState.Fullscreen
                }
                style={{ width }}
            >
                {onClose ? <div className="relative">
                    <div
                        className={`
                                absolute
                                rounded-full 
                                bg-[#cd6679] 
                                aspect-square 
                                w-[25px] 
                                -left-[0.6rem] 
                                -top-[0.8rem]
                                flex 
                                justify-center 
                                items-center 
                                cursor-pointer
                                `}
                        onClick={() => onClose(studentUsername)}
                    >
                            X
                    </div>
                </div> : null}
                <SettingsProvider hostname={studentHostname}>
                    <div className="p-4 flex flex-row justify-between">
                        <VncCardLeftModule
                            key={`vnc-card-left-${studentUsername}`}
                        />
                        {displayIncludesCenterModule(displayState) && (
                            <VncCardCenterModule
                                key={`vnc-card-center-${studentUsername}`}
                            />
                        )}
                        <VncRightModule
                            connected={connected}
                            desktopName={studentHostname}
                            displayState={displayState}
                            hasSecurityError={hasSecurityError}
                            isViewOnly={isViewOnly}
                            key={`vnc-card-right-${studentUsername}`}
                            setDisplayState={setDisplayState}
                            setIsViewOnly={setIsViewOnly}
                            sideButtonClassnames={sideButtonClassnames}
                            studentUsername={studentUsername}
                            vncRef={vncRef}
                        />
                    </div>
                    {displayState !== VncCardDisplayState.Hidden && (
                        <ClientVNC
                            height={height}
                            onCapabilities={capabilitiesHandler}
                            onConnect={connectHandler}
                            onCredentialsRequired={credentialRequiredHandler}
                            onDesktopName={desktopNameHandler}
                            onDisconnect={disconnectHandler}
                            onSecurityFailure={securityFailureHandler}
                            viewOnly={isViewOnly || true}
                            vncRef={vncRef}
                            width={width}
                        />
                    )}
                </SettingsProvider>
            </div>
        </div>
    );
}
