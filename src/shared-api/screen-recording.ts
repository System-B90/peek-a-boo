/*
 * Screen-recording constants and codec negotiation (issue #14).
 *
 * Kept out of the React component so the codec choice — the part that varies
 * per browser and is easy to get subtly wrong — can be unit tested without a
 * DOM (see tests/backend/screen-recording.test.ts).
 */

/** How long a "record and tweet" clip runs. */
export const SCREEN_RECORDING_SECONDS = 10;

/** Frames per second pulled off the VNC canvas while recording. */
export const SCREEN_RECORDING_FRAME_RATE = 10;

/**
 * Bitrate ceiling handed to MediaRecorder: 1.5 Mbps is plenty for a 10 fps
 * desktop capture and pins the expected clip size at roughly 2 MB, instead of
 * letting the browser pick a bitrate sized for full-motion video.
 */
export const SCREEN_RECORDING_BITS_PER_SECOND = 1_500_000;

/**
 * Hard ceiling on the bytes a single recording may buffer (8 MB).
 *
 * Chunks accumulate in memory until the clip is encoded, and the base64 data
 * URI that follows costs another ~4/3 of that. A pathological screen (constant
 * full-frame motion) can outrun the bitrate target, so recording is cut short
 * at this point rather than growing without bound.
 */
export const SCREEN_RECORDING_MAX_BYTES = 8 * 1024 * 1024;

/**
 * How often MediaRecorder should hand over a chunk, in milliseconds.
 *
 * Without a timeslice the recorder buffers the whole clip internally and emits
 * it in one blob at the end, which defeats the byte budget above — nothing can
 * be measured until it is too late.
 */
export const SCREEN_RECORDING_CHUNK_MS = 1000;

/**
 * True once the buffered chunks have hit the budget and recording must stop.
 */
export function exceedsRecordingBudget(bufferedBytes: number): boolean {
    return bufferedBytes >= SCREEN_RECORDING_MAX_BYTES;
}

/**
 * Container/codec preferences, best first. VP9 is the smallest for the flat,
 * mostly-static desktop content a VNC session produces; the bare types at the
 * end let a browser that only advertises a container still record.
 */
export const RECORDING_MIME_CANDIDATES = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
] as const;

/**
 * First candidate the browser admits it can record.
 *
 * Returns undefined when none match — the caller should then let MediaRecorder
 * pick its own default rather than forcing an unsupported type (which throws).
 */
export function pickRecordingMimeType(
    isTypeSupported: (mimeType: string) => boolean,
): string | undefined {
    return RECORDING_MIME_CANDIDATES.find((candidate) =>
        isTypeSupported(candidate),
    );
}
