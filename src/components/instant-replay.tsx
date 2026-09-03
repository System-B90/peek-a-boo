"use client";

import { RefObject, useCallback, useEffect, useRef } from "react";
import { VncScreenHandle } from "react-vnc";

import { getVncCanvas } from "@/components/screen-recorder";
import {
    estimateDataUriBytes,
    INSTANT_REPLAY_FRAME_INTERVAL_MS,
    INSTANT_REPLAY_FRAME_QUALITY,
    INSTANT_REPLAY_FRAME_TYPE,
    ReplayFrame,
    ReplayWindow,
    scaleFrameSize,
} from "@/shared-api/instant-replay";

/**
 * Grab one downscaled frame off `source`.
 *
 * `scratch` is reused between captures — allocating a canvas four times a
 * second, per card, is exactly the kind of churn that makes a grid stutter.
 * Returns null while the remote framebuffer has no size yet (a card that is
 * connecting), because encoding a 0x0 canvas throws in some browsers.
 */
export function captureReplayFrame(
    source: HTMLCanvasElement,
    scratch: HTMLCanvasElement,
    timestamp: number,
): null | ReplayFrame {
    const { height, width } = scaleFrameSize(source.width, source.height);
    if (width === 0 || height === 0) {
        return null;
    }

    const context = scratch.getContext("2d");
    if (!context) {
        return null;
    }
    if (scratch.width !== width || scratch.height !== height) {
        scratch.width = width;
        scratch.height = height;
    }
    context.drawImage(source, 0, 0, width, height);

    const dataUri = scratch.toDataURL(
        INSTANT_REPLAY_FRAME_TYPE,
        INSTANT_REPLAY_FRAME_QUALITY,
    );
    if (!dataUri.startsWith("data:image/")) {
        // Tainted canvas or an unsupported type — either way there is no frame.
        return null;
    }

    return { bytes: estimateDataUriBytes(dataUri), dataUri, timestamp };
}

export type InstantReplayHandle = {
    /** Frames buffered so far, oldest first. */
    takeSnapshot: () => Array<ReplayFrame>;
    /** Throw the window away (a fresh connection is not a replay of the old one). */
    clear: () => void;
};

/**
 * Keep a rolling window of the student's screen while `enabled`.
 *
 * Capture is a plain interval rather than requestAnimationFrame: the browser
 * throttles rAF in background tabs to the point of stopping it, and a replay
 * buffer that quietly dies when the mentor switches tabs is worse than one
 * that skips hidden frames deliberately (which is what the visibility check
 * below does — a hidden tab paints nothing new to capture).
 */
export function useInstantReplay(
    vncRef: RefObject<null | VncScreenHandle>,
    enabled: boolean,
): InstantReplayHandle {
    const windowRef = useRef<null | ReplayWindow>(null);
    const scratchRef = useRef<HTMLCanvasElement | null>(null);

    const takeSnapshot = useCallback(
        () => windowRef.current?.snapshot() ?? [],
        [],
    );
    const clear = useCallback(() => windowRef.current?.clear(), []);

    useEffect(() => {
        if (!enabled || typeof document === "undefined") {
            return;
        }

        const replayWindow = (windowRef.current ??= new ReplayWindow());
        const scratch = (scratchRef.current ??=
            document.createElement("canvas"));

        const timer = setInterval(() => {
            if (document.hidden) {
                return;
            }
            const canvas = getVncCanvas(vncRef);
            if (!canvas) {
                return;
            }
            const frame = captureReplayFrame(
                canvas,
                scratch,
                Date.now(),
            );
            if (frame) {
                replayWindow.push(frame);
            }
        }, INSTANT_REPLAY_FRAME_INTERVAL_MS);

        return () => {
            clearInterval(timer);
            // A disconnected card's history is stale by the time it comes
            // back, and megabytes of frames should not outlive the capture.
            replayWindow.clear();
        };
    }, [enabled, vncRef]);

    return { clear, takeSnapshot };
}
