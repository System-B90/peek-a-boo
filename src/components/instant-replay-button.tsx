"use client";

import { RefObject, useCallback, useState } from "react";
import { VncScreenHandle } from "react-vnc";

import { useInstantReplay } from "@/components/instant-replay";
import { InstantReplayDialog } from "@/components/instant-replay-dialog";
import { useStudentInfo } from "@/components/student-info-provider";
import { InstantReplayGlyph } from "@/glyphs/instant-replay";
import {
    INSTANT_REPLAY_SECONDS,
    ReplayFrame,
} from "@/shared-api/instant-replay";

type InstantReplayButtonProps = {
    vncRef: RefObject<null | VncScreenHandle>;
} & Exclude<React.HTMLAttributes<HTMLDivElement>, "onClick">;

/**
 * "Go back in time" on a connected card (issue #15).
 *
 * The rolling window is captured for as long as this button is mounted — the
 * card only renders it while connected — so pressing it opens the footage that
 * has *already* been recorded instead of starting a new recording.
 */
export function InstantReplayButton({
    vncRef,
    ...props
}: InstantReplayButtonProps) {
    const { studentName } = useStudentInfo();
    const { takeSnapshot } = useInstantReplay(vncRef, true);
    const [frames, setFrames] = useState<Array<ReplayFrame>>([]);
    const [dialogOpen, setDialogOpen] = useState(false);

    const openDialog = useCallback(() => {
        setFrames(takeSnapshot());
        setDialogOpen(true);
    }, [takeSnapshot]);

    const closeDialog = useCallback(() => {
        setDialogOpen(false);
        // The snapshot is a few megabytes of data URIs; capture keeps its own
        // copy, so there is no reason for playback's to outlive the dialog.
        setFrames([]);
    }, []);

    return (
        <>
            <InstantReplayDialog
                frames={frames}
                onClose={closeDialog}
                open={dialogOpen}
                title={`שידור חוזר — ${studentName}`}
            />
            <InstantReplayGlyph
                glyphTitle={`Instant replay (last ${INSTANT_REPLAY_SECONDS}s)`}
                onClick={openDialog}
                placement="right"
                {...props}
            />
        </>
    );
}
