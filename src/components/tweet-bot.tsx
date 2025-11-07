'use client'

import TwitterGlyph from "@/glyphs/twitter";
import { RefObject, useCallback } from "react";
import { useStudentInfo } from "./student-info-provider";
import { sendTweet } from "@/client-api/tweet";
import { VncScreenHandle } from "react-vnc";
import { enqueueApiErrorSnackbar } from "./snackbar-utils";
import { useAuth } from "./auth-provider";

export default function TweetBotGlyph({ vncRef, ...props }: { vncRef: RefObject<VncScreenHandle | null> } & Exclude<React.HTMLAttributes<HTMLDivElement>, 'onClick'>) {
    const { displayName } = useAuth();
    const { studentFirstName, studentLastName, } = useStudentInfo();

    const handleTweent = useCallback(() => {
        const handler = async () => {
            const screenShotData = vncRef.current?.rfb?.toDataURL('image/png', 100);
            const tweetMessageText = `המפקד/ת ${displayName} על ${studentFirstName} ${studentLastName}`;
            if (screenShotData) {
                await sendTweet({
                    message: tweetMessageText,
                    screenShotData: screenShotData,
                });
            }
            else {
                await sendTweet({
                    message: tweetMessageText,
                });
            }
        }
        handler().catch((error) => { enqueueApiErrorSnackbar('Failed to send tweet!', error); })
    }, [studentFirstName, studentLastName, displayName, vncRef]);

    return (
        <TwitterGlyph
            placement='right'
            glyphTitle={'Tweet'}
            onClick={handleTweent}
            {...props}
        />
    )
}