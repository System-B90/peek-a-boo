"use client";

import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { InstantReplayGlyph } from "@/glyphs/instant-replay";
import {
    frameIndexAtOffset,
    INSTANT_REPLAY_SECONDS,
    ReplayFrame,
    replaySpanMs,
    secondsBeforeNow,
} from "@/shared-api/instant-replay";

/**
 * How often playback advances its clock. 40ms is smoother than the 4 fps the
 * frames were captured at, which keeps the scrubber moving continuously
 * instead of hopping frame to frame.
 */
const PLAYBACK_TICK_MS = 40;

type InstantReplayDialogProps = {
    title: string;
    frames: Array<ReplayFrame>;
    open: boolean;
    onClose: () => void;
};

/**
 * Format an age as the timeline reads it: "-12.3s", or "עכשיו" at the end.
 */
function formatAge(secondsAgo: number): string {
    return secondsAgo < 0.05 ? "עכשיו" : `-${secondsAgo.toFixed(1)}s`;
}

/**
 * Play back a captured window, CCTV style: scrub anywhere in the last
 * {@link INSTANT_REPLAY_SECONDS} seconds, pause on the interesting frame.
 */
export function InstantReplayDialog({
    title,
    frames,
    open,
    onClose,
}: InstantReplayDialogProps) {
    const [offsetMs, setOffsetMs] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    const spanMs = useMemo(() => replaySpanMs(frames), [frames]);
    const frameIndex = frameIndexAtOffset(frames, offsetMs);
    const frame = frameIndex < 0 ? undefined : frames[frameIndex];

    // Every opening starts from the beginning of the window, playing. This is
    // React's "adjust state while rendering" pattern rather than an effect:
    // resetting in an effect would render one frame of the previous replay
    // first (see https://react.dev/learn/you-might-not-need-an-effect).
    const [ wasOpen, setWasOpen ] = useState(open);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            setOffsetMs(0);
            setIsPlaying(true);
        }
    }

    useEffect(() => {
        if (!open || !isPlaying || spanMs <= 0) {
            return;
        }
        // Advance by measured wall-clock time rather than by the tick length,
        // so a throttled timer replays at the speed it was captured at.
        let previous = Date.now();
        const timer = setInterval(() => {
            const now = Date.now();
            const elapsed = now - previous;
            previous = now;
            setOffsetMs((current) =>
                current + elapsed > spanMs ? 0 : current + elapsed,
            );
        }, PLAYBACK_TICK_MS);

        return () => clearInterval(timer);
    }, [isPlaying, open, spanMs]);

    const togglePlaying = useCallback(() => setIsPlaying((v) => !v), []);
    const handleScrub = useCallback(
        (_event: Event, value: Array<number> | number) => {
            setIsPlaying(false);
            setOffsetMs(Array.isArray(value) ? value[0] : value);
        },
        [],
    );

    return (
        <Dialog dir="rtl" fullWidth maxWidth="md" onClose={onClose} open={open}>
            <DialogTitle className="flex flex-row items-center gap-2" dir="rtl">
                <InstantReplayGlyph
                    className="w-8 h-8 text-[#bb86fc]"
                    data-static="true"
                    glyphTitle=""
                />
                {title}
            </DialogTitle>
            <DialogContent dir="rtl">
                {frame ? (
                    <>
                        <DialogContentText>
                            {`${INSTANT_REPLAY_SECONDS} השניות האחרונות על מסך החניך`}
                        </DialogContentText>
                        <Box mb={1} mt={2}>
                            <Image
                                alt="שידור חוזר"
                                className="w-full max-h-[60vh] object-contain bg-black"
                                height={1080}
                                src={frame.dataUri}
                                unoptimized
                                width={1920}
                            />
                        </Box>
                        <div className="flex flex-row items-center gap-3">
                            <IconButton
                                aria-label={isPlaying ? "Pause" : "Play"}
                                onClick={togglePlaying}
                            >
                                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                            </IconButton>
                            <Slider
                                aria-label="Replay position"
                                dir="ltr"
                                max={Math.max(spanMs, 1)}
                                min={0}
                                onChange={handleScrub}
                                size="small"
                                step={10}
                                value={offsetMs}
                            />
                            <Typography
                                className="tabular-nums min-w-[4.5rem] text-center"
                                variant="body2"
                            >
                                {formatAge(secondsBeforeNow(frames, frameIndex))}
                            </Typography>
                        </div>
                    </>
                ) : (
                    <DialogContentText>
                        עדיין אין הקלטה זמינה — נסו שוב בעוד מספר שניות.
                    </DialogContentText>
                )}
            </DialogContent>
            <DialogActions className="flex flex-row-reverse gap-x-1" dir="ltr">
                <Button onClick={onClose}>סגור</Button>
            </DialogActions>
        </Dialog>
    );
}
