"use client";

import { RefObject, useCallback, useMemo, useState } from "react";
import { VncScreenHandle } from "react-vnc";

import { sendTweet } from "@/client-api/tweet";
import { useAuth } from "@/components/auth-provider";
import { enqueueApiErrorSnackbar } from "@/components/snackbar-utils";
import { useStudentInfo } from "@/components/student-info-provider";
import { TweetDialog } from "@/components/tweet-dialog";
import { TwitterGlyph } from "@/glyphs/twitter";

export function TweetButton({
    vncRef,
    ...props
}: { vncRef: RefObject<null | VncScreenHandle> } & Exclude<
    React.HTMLAttributes<HTMLDivElement>,
    "onClick"
>) {
    const { displayName: commanderDisplayName } = useAuth();
    const { studentFirstName, studentLastName } = useStudentInfo();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [screenShotData, setScreenShotData] = useState<string | undefined>(
        undefined,
    );

    const baseTweetMessage = useMemo(
        () =>
            `המפקד/ת ${commanderDisplayName} על ${studentFirstName} ${studentLastName}`,
        [commanderDisplayName, studentFirstName, studentLastName],
    );

    const handleDialogSubmit = useCallback(
        (text: string) => {
            const handler = async () => {
                const tweetMessageText = `${baseTweetMessage}\n${text}`;
                if (screenShotData) {
                    await sendTweet({
                        message: tweetMessageText,
                        screenShotData,
                    });
                } else {
                    await sendTweet({
                        message: tweetMessageText,
                    });
                }
            };

            handler().catch((error) =>
                enqueueApiErrorSnackbar("Failed to send tweet!", error),
            );
        },
        [screenShotData, baseTweetMessage],
    );

    const openDialog = useCallback(() => {
        setScreenShotData(vncRef.current?.rfb?.toDataURL("image/png", 100));
        setDialogOpen(true);
    }, [setScreenShotData, vncRef]);

    return (
        <>
            <TweetDialog
                baseMessageText={baseTweetMessage}
                description="צרפו פירוט נוסף לציוץ (אופציונלי)"
                imageSrc={screenShotData}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleDialogSubmit}
                open={dialogOpen}
                title="שליחת ציוץ"
            />
            <TwitterGlyph
                glyphTitle={"Tweet"}
                onClick={openDialog}
                placement="right"
                {...props}
            />
        </>
    );
}
