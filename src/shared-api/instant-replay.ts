/*
 * Instant replay: the "last 15 seconds" sliding window (issue #15).
 *
 * The card keeps a rolling buffer of downscaled frames grabbed off the VNC
 * canvas — the same trick a CCTV recorder (or a console's replay buffer) uses:
 * capture continuously, keep only the trailing window, and hand it over on
 * demand. Everything that decides *what stays in the window* lives here, free
 * of the DOM, so it can be unit tested (tests/backend/instant-replay.test.ts).
 */

/** How far back a replay reaches, in seconds — the CCTV window from issue #15. */
export const INSTANT_REPLAY_SECONDS = 15;

/**
 * Frames captured per second.
 *
 * A VNC desktop is mostly static, so 4 fps is enough to see what happened
 * while keeping both the CPU cost of the periodic capture and the buffered
 * bytes low — this runs for every connected card, forever, not just while a
 * mentor is watching.
 */
export const INSTANT_REPLAY_FRAME_RATE = 4;

/** Milliseconds between two captures. */
export const INSTANT_REPLAY_FRAME_INTERVAL_MS = Math.round(
    1000 / INSTANT_REPLAY_FRAME_RATE,
);

/** Length of the window in milliseconds. */
export const INSTANT_REPLAY_WINDOW_MS = INSTANT_REPLAY_SECONDS * 1000;

/**
 * Longest edge a buffered frame is scaled down to before it is encoded.
 *
 * Student desktops are commonly 1920px wide; storing them at full size costs
 * an order of magnitude more memory than a replay needs to be readable.
 */
export const INSTANT_REPLAY_MAX_WIDTH = 640;

/** JPEG quality for buffered frames — legible text, a fraction of PNG's size. */
export const INSTANT_REPLAY_FRAME_QUALITY = 0.5;

/** Content type buffered frames are encoded as. */
export const INSTANT_REPLAY_FRAME_TYPE = "image/jpeg";

/**
 * Hard ceiling on the bytes one card's window may hold (6 MB).
 *
 * The frame count alone does not bound memory: a busy screen encodes to much
 * larger JPEGs than an idle one. Whichever limit is hit first — age or bytes —
 * evicts the oldest frames, so a grid of cards has a predictable footprint.
 */
export const INSTANT_REPLAY_MAX_BYTES = 6 * 1024 * 1024;

export type ReplayFrame = {
    /** `performance.now()`-style capture time, milliseconds. */
    timestamp: number;
    /** Base64 data URI of the encoded frame. */
    dataUri: string;
    /** Approximate encoded size, used for the byte budget. */
    bytes: number;
};

/**
 * Bytes a base64 data URI occupies once decoded.
 *
 * Cheaper than measuring the string itself and close enough for a budget:
 * base64 carries 3 bytes per 4 characters, minus up to two "=" pad characters.
 */
export function estimateDataUriBytes(dataUri: string): number {
    const payload = dataUri.slice(dataUri.indexOf(",") + 1);
    const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
    return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

/**
 * Fit `width`x`height` inside `maxWidth`, keeping the aspect ratio.
 *
 * Frames wider than the cap are scaled down; anything already smaller is left
 * alone rather than being blown up (upscaling costs bytes and shows nothing
 * new). Returned dimensions are whole pixels and never zero for a non-empty
 * source, because a 0-sized canvas cannot be encoded.
 */
export function scaleFrameSize(
    width: number,
    height: number,
    maxWidth: number = INSTANT_REPLAY_MAX_WIDTH,
): { width: number; height: number } {
    if (width <= 0 || height <= 0) {
        return { height: 0, width: 0 };
    }
    if (width <= maxWidth) {
        return { height: Math.round(height), width: Math.round(width) };
    }
    const scale = maxWidth / width;
    return {
        height: Math.max(1, Math.round(height * scale)),
        width: Math.max(1, Math.round(width * scale)),
    };
}

/**
 * A fixed-duration, byte-capped sliding window of frames, oldest first.
 *
 * Eviction is measured against the newest frame rather than the wall clock:
 * capture pauses while the browser tab is hidden, and a mentor coming back to
 * a paused tab should still see the last 15 seconds that were *recorded*
 * instead of an empty buffer.
 */
export class ReplayWindow {
    private frames: Array<ReplayFrame> = [];
    private bufferedBytes = 0;

    constructor(
        private readonly windowMs: number = INSTANT_REPLAY_WINDOW_MS,
        private readonly maxBytes: number = INSTANT_REPLAY_MAX_BYTES,
    ) {}

    /** Bytes currently held by the window. */
    get byteLength(): number {
        return this.bufferedBytes;
    }

    /** Number of buffered frames. */
    get length(): number {
        return this.frames.length;
    }

    /**
     * Append a frame and evict whatever falls outside the window.
     *
     * Frames older than the newest one by more than the window, and the oldest
     * frames beyond the byte budget, are dropped. The newest frame is always
     * kept, even when it alone exceeds the budget — a replay of nothing is
     * worse than a replay of one frame.
     */
    push(frame: ReplayFrame): void {
        this.frames.push(frame);
        this.bufferedBytes += frame.bytes;

        const newest = frame.timestamp;
        let evicted = 0;
        while (
            evicted < this.frames.length - 1 &&
            (newest - this.frames[evicted].timestamp > this.windowMs ||
                this.bufferedBytes > this.maxBytes)
        ) {
            this.bufferedBytes -= this.frames[evicted].bytes;
            evicted += 1;
        }
        if (evicted > 0) {
            this.frames = this.frames.slice(evicted);
        }
    }

    /**
     * Snapshot of the window, oldest first.
     *
     * A copy: playback holds on to the array while capture keeps running, and
     * the frames on screen must not shift under the scrubber.
     */
    snapshot(): Array<ReplayFrame> {
        return [ ...this.frames ];
    }

    /** Drop everything — used when a card disconnects or unmounts. */
    clear(): void {
        this.frames = [];
        this.bufferedBytes = 0;
    }
}

/** Wall-clock length of a captured window, in milliseconds. */
export function replaySpanMs(frames: ReadonlyArray<ReplayFrame>): number {
    if (frames.length < 2) {
        return 0;
    }
    return frames[frames.length - 1].timestamp - frames[0].timestamp;
}

/**
 * Index of the frame on screen `offsetMs` into playback.
 *
 * Frames are unevenly spaced (capture skips hidden tabs and stalled cards), so
 * playback is driven by timestamps rather than by a frame counter: the frame
 * shown is the newest one that had already been captured at that offset.
 * Returns -1 for an empty window, and clamps outside the span.
 */
export function frameIndexAtOffset(
    frames: ReadonlyArray<ReplayFrame>,
    offsetMs: number,
): number {
    if (frames.length === 0) {
        return -1;
    }
    const target = frames[0].timestamp + Math.max(0, offsetMs);
    let low = 0;
    let high = frames.length - 1;
    let found = 0;
    while (low <= high) {
        const middle = (low + high) >> 1;
        if (frames[middle].timestamp <= target) {
            found = middle;
            low = middle + 1;
        } else {
            high = middle - 1;
        }
    }
    return found;
}

/**
 * How long ago a frame was captured, relative to the end of the window.
 *
 * This is what the playback UI labels the timeline with ("-12.3s"), so it is
 * measured from the newest frame — the moment the mentor pressed replay.
 */
export function secondsBeforeNow(
    frames: ReadonlyArray<ReplayFrame>,
    index: number,
): number {
    if (frames.length === 0 || index < 0 || index >= frames.length) {
        return 0;
    }
    const newest = frames[frames.length - 1].timestamp;
    return (newest - frames[index].timestamp) / 1000;
}
