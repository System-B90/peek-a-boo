"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import ClientVNC, {
    VncDesktopNameEvent,
    VncCapabilitiesEvent,
} from "./client-vnc";
import { SettingsProvider } from "./settings-provider";
import
{
    VncCardProps,
    VncCardLeftModule,
    VncCardCenterModule,
    VncRightModule,
} from "./vnc-card-inner-utils";
import { VncScreenHandle } from "react-vnc";
import { useStudentInfo } from "./student-info-provider";

export enum VncCardDisplayState
{
    Undefined,
    Default,
    Expanded,
    Collapsed,
    Hidden,
    Fullscreen,
}

export function displayIncludesCenterModule(displayState: VncCardDisplayState)
{
    switch (displayState)
    {
        case VncCardDisplayState.Expanded:
        case VncCardDisplayState.Fullscreen:
            return true;
        case VncCardDisplayState.Default:
        case VncCardDisplayState.Collapsed:
        case VncCardDisplayState.Hidden:
        case VncCardDisplayState.Undefined:
            return false;
    }
}

export default function VncCardInner({
    studentUsername,
    isFullscreen,
    onClose,
}: VncCardProps)
{
    const { studentName, hostname: studentHostname } = useStudentInfo();
    const [ connected, setConnected ] = useState<boolean>(false);
    const [ displayState, setDisplayState ] = useState<VncCardDisplayState>(
        isFullscreen ? VncCardDisplayState.Fullscreen : VncCardDisplayState.Default
    );
    const [ isViewOnly, setIsViewOnly ] = useState<boolean>(true);
    const [ hasSecurityError, setHasSecurityError ] = useState<boolean>(false);
    const FULLSCREEN_SCALE_FACTOR = 0.9;
    const SMALL_SCALE_FACTOR = 0.2;
    const [ scaleFactor, setScaleFactor ] = useState<number>(
        isFullscreen ? FULLSCREEN_SCALE_FACTOR : SMALL_SCALE_FACTOR
    );

    const [ width, setWidth ] = useState<number>(1920 * scaleFactor);
    const [ height, setHeight ] = useState<number>(1200 * scaleFactor);
    const [ desktopName, setDesktopName ] = useState<string>(studentHostname);
    console.log('desktopName', desktopName);

    const vncRef = useRef<VncScreenHandle>(null);

    useEffect(() =>
    {
        if (!isFullscreen)
        {
            return;
        }
        document.title = `${studentName} | Peek-a-Boo`;
    }, [ isFullscreen, studentName ]);

    const connectHandler = useCallback(() =>
    {
        setConnected(true);
    }, [ setConnected ]);

    const disconnectHandler = useCallback(() =>
    {
        setConnected(false);
    }, [ setConnected ]);

    const credentialRequiredHandler = useCallback(() =>
    {
        setHasSecurityError(true);
    }, []);

    const securityFailureHandler = useCallback(() =>
    {
        setHasSecurityError(true);
    }, [ setHasSecurityError ]);

    const desktopNameHandler = useCallback(
        (event: VncDesktopNameEvent) =>
        {
            console.log(event.detail.name);
            setDesktopName(event.detail.name);
        },
        [ setDesktopName ]
    );

    const capabilitiesHandler = useCallback((event: VncCapabilitiesEvent) =>
    {
        console.log("Capabilities", event);
    }, []);

    useEffect(() =>
    {
        switch (displayState)
        {
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
    }, [ displayState, setScaleFactor ]);

    useEffect(() =>
    {
        setWidth(1920 * scaleFactor);
        setHeight(1080 * scaleFactor);
    }, [ scaleFactor, setWidth, setHeight ]);

    const sideButtonClassnames = "w-6 h-6 m-1";

    return (
        <div>
            <div
                className={ `${isFullscreen ? "m-0" : "m-4"
                    } pt-2 bg-slate-800 rounded-xl shadow-2xl transition-all vnc-card` }
                style={ { width } }
                data-is-expanded={
                    displayState === VncCardDisplayState.Expanded ||
                    displayState === VncCardDisplayState.Fullscreen
                }
            >
                {
                    onClose && <div className="relative">
                        <div
                            onClick={ () => onClose(studentUsername) }
                            className={ `
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
                        >
                            X
                        </div>
                    </div>
                }
                <SettingsProvider hostname={ studentHostname }>
                    <div className="p-4 flex flex-row justify-between">
                        <VncCardLeftModule key={ `vnc-card-left-${studentUsername}` } />
                        { displayIncludesCenterModule(displayState) && (
                            <VncCardCenterModule key={ `vnc-card-center-${studentUsername}` } />
                        ) }
                        <VncRightModule
                            key={ `vnc-card-right-${studentUsername}` }
                            displayState={ displayState }
                            hasSecurityError={ hasSecurityError }
                            connected={ connected }
                            desktopName={ studentHostname }
                            isViewOnly={ isViewOnly }
                            setIsViewOnly={ setIsViewOnly }
                            sideButtonClassnames={ sideButtonClassnames }
                            setDisplayState={ setDisplayState }
                            studentUsername={ studentUsername }
                            vncRef={ vncRef }
                        />
                    </div>
                    { displayState !== VncCardDisplayState.Hidden && (
                        <ClientVNC
                            onConnect={ connectHandler }
                            onDisconnect={ disconnectHandler }
                            onDesktopName={ desktopNameHandler }
                            onSecurityFailure={ securityFailureHandler }
                            onCredentialsRequired={ credentialRequiredHandler }
                            onCapabilities={ capabilitiesHandler }
                            viewOnly={ isViewOnly || true }
                            vncRef={ vncRef }
                            width={ width }
                            height={ height }
                        />
                    ) }
                </SettingsProvider>
            </div>
        </div>
    );
}
