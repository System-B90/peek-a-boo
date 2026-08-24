"use client";

import { RefObject } from "react";
import { VncScreenHandle } from "react-vnc";

import {
    exceedsRecordingBudget,
    pickRecordingMimeType,
    SCREEN_RECORDING_BITS_PER_SECOND,
    SCREEN_RECORDING_CHUNK_MS,
    SCREEN_RECORDING_FRAME_RATE,
} from "@/shared-api/screen-recording";

/**
 * The canvas noVNC paints the remote framebuffer onto.
 *
 * RFB keeps it private (`_canvas`), so fall back to the DOM: the canvas is
 * appended to the target container the VncScreen rendered.
 */
export function getVncCanvas(
    vncRef: RefObject<null | VncScreenHandle>,
): HTMLCanvasElement | null {
    const rfb = vncRef.current?.rfb;
    if (!rfb) {
        return null;
    }
    const privateCanvas = (rfb as unknown as { _canvas?: HTMLCanvasElement })
        ._canvas;
    if (privateCanvas) {
        return privateCanvas;
    }
    const target = (rfb as unknown as { _target?: HTMLElement })._target;
    return target?.getElementsByTagName("canvas")[0] ?? null;
}

/**
 * Record `canvas` for `durationMs` and resolve with a base64 data URI of the
 * clip, ready to hand to `/api/tweet`.
 *
 * Rejects when the browser cannot capture the canvas or record media at all,
 * so callers can surface that instead of silently tweeting nothing.
 */
export function recordCanvas(
    canvas: HTMLCanvasElement,
    durationMs: number,
): Promise<string> {
    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
        return Promise.reject(
            new Error("Screen recording is not supported by this browser!"),
        );
    }

    const stream = canvas.captureStream(SCREEN_RECORDING_FRAME_RATE);
    const mimeType = pickRecordingMimeType((candidate) =>
        MediaRecorder.isTypeSupported(candidate),
    );
    const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: SCREEN_RECORDING_BITS_PER_SECOND,
    });
    let chunks: Array<Blob> = [];
    let bufferedBytes = 0;

    return new Promise<string>((resolve, reject) => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        const stopRecording = () => {
            if (timer !== undefined) {
                clearTimeout(timer);
                timer = undefined;
            }
            if (recorder.state !== "inactive") {
                recorder.stop();
            }
        };

        const release = () => {
            // Drop the references as soon as the clip is encoded (or has
            // failed) so a long-lived card does not sit on megabytes of video.
            chunks = [];
            bufferedBytes = 0;
            stream.getTracks().forEach((track) => track.stop());
        };

        recorder.addEventListener("dataavailable", (event) => {
            if (event.data.size === 0) {
                return;
            }
            chunks.push(event.data);
            bufferedBytes += event.data.size;
            if (exceedsRecordingBudget(bufferedBytes)) {
                stopRecording();
            }
        });
        recorder.addEventListener("error", () => {
            release();
            reject(new Error("Screen recording failed!"));
        });
        recorder.addEventListener("stop", () => {
            if (chunks.length === 0) {
                release();
                reject(new Error("Screen recording produced no data!"));
                return;
            }
            const blob = new Blob(chunks, {
                type: recorder.mimeType || mimeType || "video/webm",
            });
            release();
            const reader = new FileReader();
            reader.onerror = () =>
                reject(new Error("Failed to encode the screen recording!"));
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });

        // A timeslice keeps chunks flowing so the byte budget can be enforced
        // while recording, not after the whole clip is already in memory.
        recorder.start(SCREEN_RECORDING_CHUNK_MS);
        timer = setTimeout(stopRecording, durationMs);
    });
}

/**
 * Record the student's screen for `durationMs` and resolve with a data URI.
 */
export async function recordVncScreen(
    vncRef: RefObject<null | VncScreenHandle>,
    durationMs: number,
): Promise<string> {
    const canvas = getVncCanvas(vncRef);
    if (!canvas) {
        throw new Error("No connected screen to record!");
    }
    return await recordCanvas(canvas, durationMs);
}
