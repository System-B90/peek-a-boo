'use client';

import TwitterGlyph from "@/glyphs/twitter";
import { RefObject, useCallback, useMemo, useState } from "react";
import { useStudentInfo } from "./student-info-provider";
import { sendTweet } from "@/client-api/tweet";
import { VncScreenHandle } from "react-vnc";
import { enqueueApiErrorSnackbar } from "./snackbar-utils";
import { useAuth } from "./auth-provider";
import TweetDialog from "@/components/tweet-dialog";

export default function TweetButton({ vncRef, ...props }: { vncRef: RefObject<VncScreenHandle | null>; } & Exclude<React.HTMLAttributes<HTMLDivElement>, 'onClick'>)
{
    const { displayName: commanderDisplayName } = useAuth();
    const { studentFirstName, studentLastName, } = useStudentInfo();
    const [ dialogOpen, setDialogOpen ] = useState(false);
    const [ screenShotData, setScreenShotData ] = useState<string | undefined>(undefined);

    const baseTweetMessage = useMemo(() => `המפקד/ת ${commanderDisplayName} על ${studentFirstName} ${studentLastName}`, [ commanderDisplayName, studentFirstName, studentLastName ]);

    const handleDialogSubmit = useCallback((text: string) =>
    {
        const handler = async () =>
        {
            const tweetMessageText = `${baseTweetMessage}\n${text}`;
            if (screenShotData)
            {
                await sendTweet({
                    message: tweetMessageText,
                    screenShotData,
                });
            }
            else
            {
                await sendTweet({
                    message: tweetMessageText,
                });
            }
        };

        handler()
            .catch((error) => enqueueApiErrorSnackbar('Failed to send tweet!', error));

    }, [ screenShotData, baseTweetMessage ]);

    const openDialog = useCallback(() =>
    {
        setScreenShotData(vncRef.current?.rfb?.toDataURL('image/png', 100));
        setDialogOpen(true);
    }, [ setScreenShotData, vncRef ]);

    return (
        <>
            <TweetDialog
                title="שליחת ציוץ"
                description="צרפו פירוט נוסף לציוץ (אופציונלי)"
                imageSrc={ screenShotData }
                baseMessageText={ baseTweetMessage }
                open={ dialogOpen }
                onClose={ () => setDialogOpen(false) }
                onSubmit={ handleDialogSubmit } />
            <TwitterGlyph
                placement='right'
                glyphTitle={ 'Tweet' }
                onClick={ openDialog }
                { ...props }
            />
        </>
    );
}
