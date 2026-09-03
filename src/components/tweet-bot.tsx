"use client";

import {
    RefObject,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { VncScreenHandle } from "react-vnc";

import { sendTweet } from "@/client-api/tweet";
import { useAuth } from "@/components/auth-provider";
import { recordVncScreen } from "@/components/screen-recorder";
import { enqueueApiErrorSnackbar } from "@/components/snackbar-utils";
import { useStudentInfo } from "@/components/student-info-provider";
import { TweetDialog } from "@/components/tweet-dialog";
import { RecordGlyph } from "@/glyphs/record";
import { TwitterGlyph } from "@/glyphs/twitter";
import { SCREEN_RECORDING_SECONDS } from "@/shared-api/screen-recording";

type TweetButtonProps = { vncRef: RefObject<null | VncScreenHandle> } & Exclude<
    React.HTMLAttributes<HTMLDivElement>,
    "onClick"
>;

/**
 * Message prefix every tweet carries: who tweeted about whom.
 */
function useBaseTweetMessage() {
    const { displayName: commanderDisplayName } = useAuth();
    const { studentFirstName, studentLastName } = useStudentInfo();

    return useMemo(
        () =>
            `המפקד/ת ${commanderDisplayName} על ${studentFirstName} ${studentLastName}`,
        [commanderDisplayName, studentFirstName, studentLastName],
    );
}

/**
 * Send the composed tweet, reporting failures through the snackbar.
 */
function useTweetSubmitHandler(
    baseTweetMessage: string,
    attachment: string | undefined,
) {
    return useCallback(
        (text: string) => {
            const handler = async () => {
                await sendTweet({
                    message: `${baseTweetMessage}\n${text}`,
                    attachment,
                });
            };

            handler().catch((error) =>
                enqueueApiErrorSnackbar("Failed to send tweet!", error),
            );
        },
        [attachment, baseTweetMessage],
    );
}

export function TweetButton({ vncRef, ...props }: TweetButtonProps) {
    const baseTweetMessage = useBaseTweetMessage();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [screenShotData, setScreenShotData] = useState<string | undefined>(
        undefined,
    );

    const handleDialogSubmit = useTweetSubmitHandler(
        baseTweetMessage,
        screenShotData,
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

/**
 * Record the student's screen for a few seconds, then tweet the clip.
 *
 * The dialog only opens once the recording is in hand, so the mentor reviews
 * what is about to be posted — same contract as the screenshot tweet.
 */
export function RecordButton({ vncRef, ...props }: TweetButtonProps) {
    const baseTweetMessage = useBaseTweetMessage();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingData, setRecordingData] = useState<string | undefined>(
        undefined,
    );
    const abortRef = useRef<AbortController | null>(null);

    useEffect(
        () => () => {
            // Unmounting mid-recording (card closed, grid re-rendered) must
            // tear the capture down; otherwise it runs to completion holding
            // the stream and its chunks for a component nobody can see.
            abortRef.current?.abort();
        },
        [],
    );

    const handleDialogSubmit = useTweetSubmitHandler(
        baseTweetMessage,
        recordingData,
    );

    const closeDialog = useCallback(() => {
        setDialogOpen(false);
        // Release the clip: a data URI of a few megabytes has no reason to
        // outlive the dialog that showed it.
        setRecordingData(undefined);
    }, []);

    const startRecording = useCallback(() => {
        // A ref, not the isRecording state: two clicks in one frame would both
        // read the pre-render state and start two captures.
        if (abortRef.current) {
            return;
        }
        const controller = new AbortController();
        abortRef.current = controller;
        setIsRecording(true);

        recordVncScreen(
            vncRef,
            SCREEN_RECORDING_SECONDS * 1000,
            controller.signal,
        )
            .then((dataUri) => {
                abortRef.current = null;
                setIsRecording(false);
                setRecordingData(dataUri);
                setDialogOpen(true);
            })
            .catch((error) => {
                abortRef.current = null;
                if (controller.signal.aborted) {
                    // Cancelled by unmount — there is nobody left to tell.
                    return;
                }
                setIsRecording(false);
                enqueueApiErrorSnackbar("Failed to record screen!", error);
            });
    }, [vncRef]);

    return (
        <>
            <TweetDialog
                baseMessageText={baseTweetMessage}
                description="צרפו פירוט נוסף לציוץ (אופציונלי)"
                onClose={closeDialog}
                onSubmit={handleDialogSubmit}
                open={dialogOpen}
                title="שליחת הקלטת מסך"
                videoSrc={recordingData}
            />
            <RecordGlyph
                data-recording={isRecording}
                glyphTitle={
                    isRecording
                        ? "Recording..."
                        : `Record ${SCREEN_RECORDING_SECONDS}s and tweet`
                }
                onClick={startRecording}
                placement="right"
                {...props}
            />
        </>
    );
}
