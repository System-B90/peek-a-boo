/*
 * The sliding window is what makes instant replay (issue #15) bounded: it must
 * drop frames by age and by bytes, and playback must map a wall-clock offset
 * onto unevenly spaced frames. Both are pure, so both are pinned here.
 */
import { describe, expect, it } from "vitest";

import {
    estimateDataUriBytes,
    frameIndexAtOffset,
    INSTANT_REPLAY_FRAME_INTERVAL_MS,
    INSTANT_REPLAY_MAX_WIDTH,
    INSTANT_REPLAY_SECONDS,
    INSTANT_REPLAY_WINDOW_MS,
    ReplayFrame,
    ReplayWindow,
    replaySpanMs,
    scaleFrameSize,
    secondsBeforeNow,
} from "@/shared-api/instant-replay";

function frame(timestamp: number, bytes = 1000): ReplayFrame {
    return { bytes, dataUri: `data:image/jpeg;base64,${timestamp}`, timestamp };
}

describe("instant replay constants", () => {
    it("covers the fifteen second window from the issue", () => {
        expect(INSTANT_REPLAY_SECONDS).toBe(15);
        expect(INSTANT_REPLAY_WINDOW_MS).toBe(15_000);
    });

    it("captures on a whole-millisecond interval", () => {
        expect(INSTANT_REPLAY_FRAME_INTERVAL_MS).toBe(250);
    });
});

describe("scaleFrameSize", () => {
    it("scales a student desktop down to the cap, keeping the ratio", () => {
        expect(scaleFrameSize(1920, 1080)).toEqual({
            height: 360,
            width: INSTANT_REPLAY_MAX_WIDTH,
        });
    });

    it("never upscales a smaller framebuffer", () => {
        expect(scaleFrameSize(320, 200)).toEqual({ height: 200, width: 320 });
    });

    it("reports an empty size for a framebuffer that has none yet", () => {
        expect(scaleFrameSize(0, 0)).toEqual({ height: 0, width: 0 });
    });

    it("keeps an extreme aspect ratio at least one pixel tall", () => {
        expect(scaleFrameSize(40_000, 10).height).toBe(1);
    });
});

describe("estimateDataUriBytes", () => {
    it("measures the decoded payload, not the URI", () => {
        // "AAAA" decodes to three bytes; the data: prefix must not count.
        expect(estimateDataUriBytes("data:image/jpeg;base64,AAAA")).toBe(3);
    });

    it("discounts base64 padding", () => {
        expect(estimateDataUriBytes("data:image/jpeg;base64,AAA=")).toBe(2);
        expect(estimateDataUriBytes("data:image/jpeg;base64,AA==")).toBe(1);
    });
});

describe("ReplayWindow", () => {
    it("keeps frames inside the window, oldest first", () => {
        const replayWindow = new ReplayWindow(1000);
        replayWindow.push(frame(0));
        replayWindow.push(frame(500));
        replayWindow.push(frame(1000));

        expect(replayWindow.snapshot().map((f) => f.timestamp)).toEqual([
            0, 500, 1000,
        ]);
    });

    it("evicts frames older than the window relative to the newest frame", () => {
        const replayWindow = new ReplayWindow(1000);
        replayWindow.push(frame(0));
        replayWindow.push(frame(500));
        replayWindow.push(frame(1400));

        expect(replayWindow.snapshot().map((f) => f.timestamp)).toEqual([
            500, 1400,
        ]);
        expect(replayWindow.length).toBe(2);
    });

    it("evicts on the byte budget even when the frames are recent", () => {
        const replayWindow = new ReplayWindow(60_000, 2500);
        replayWindow.push(frame(0, 1000));
        replayWindow.push(frame(100, 1000));
        replayWindow.push(frame(200, 1000));

        expect(replayWindow.snapshot().map((f) => f.timestamp)).toEqual([
            100, 200,
        ]);
        expect(replayWindow.byteLength).toBe(2000);
    });

    it("keeps the newest frame even when it alone busts the budget", () => {
        const replayWindow = new ReplayWindow(60_000, 100);
        replayWindow.push(frame(0, 50));
        replayWindow.push(frame(100, 4000));

        expect(replayWindow.snapshot().map((f) => f.timestamp)).toEqual([ 100 ]);
        expect(replayWindow.byteLength).toBe(4000);
    });

    it("keeps the byte count in step with eviction over a long run", () => {
        const replayWindow = new ReplayWindow(1000, 10_000);
        for (let index = 0; index < 100; index += 1) {
            replayWindow.push(frame(index * 250, 400));
        }

        expect(replayWindow.length).toBe(5);
        expect(replayWindow.byteLength).toBe(5 * 400);
    });

    it("hands out a snapshot that later captures cannot mutate", () => {
        const replayWindow = new ReplayWindow(1000);
        replayWindow.push(frame(0));
        const snapshot = replayWindow.snapshot();
        replayWindow.push(frame(200));

        expect(snapshot).toHaveLength(1);
    });

    it("drops everything on clear", () => {
        const replayWindow = new ReplayWindow();
        replayWindow.push(frame(0, 1234));
        replayWindow.clear();

        expect(replayWindow.length).toBe(0);
        expect(replayWindow.byteLength).toBe(0);
        expect(replayWindow.snapshot()).toEqual([]);
    });
});

describe("replaySpanMs", () => {
    it("is the distance between the first and last frame", () => {
        expect(replaySpanMs([ frame(1000), frame(4000) ])).toBe(3000);
    });

    it("is zero for an empty or single-frame window", () => {
        expect(replaySpanMs([])).toBe(0);
        expect(replaySpanMs([ frame(1000) ])).toBe(0);
    });
});

describe("frameIndexAtOffset", () => {
    const frames = [ frame(1000), frame(1250), frame(4000), frame(4100) ];

    it("shows the newest frame captured at that offset", () => {
        expect(frameIndexAtOffset(frames, 0)).toBe(0);
        expect(frameIndexAtOffset(frames, 250)).toBe(1);
        // A capture gap holds the previous frame on screen, as it should.
        expect(frameIndexAtOffset(frames, 2000)).toBe(1);
        expect(frameIndexAtOffset(frames, 3000)).toBe(2);
    });

    it("clamps outside the span", () => {
        expect(frameIndexAtOffset(frames, -500)).toBe(0);
        expect(frameIndexAtOffset(frames, 999_999)).toBe(3);
    });

    it("reports no frame for an empty window", () => {
        expect(frameIndexAtOffset([], 0)).toBe(-1);
    });
});

describe("secondsBeforeNow", () => {
    const frames = [ frame(1000), frame(6000), frame(16_000) ];

    it("measures backwards from the newest frame", () => {
        expect(secondsBeforeNow(frames, 0)).toBe(15);
        expect(secondsBeforeNow(frames, 1)).toBe(10);
        expect(secondsBeforeNow(frames, 2)).toBe(0);
    });

    it("is zero for an index outside the window", () => {
        expect(secondsBeforeNow(frames, -1)).toBe(0);
        expect(secondsBeforeNow(frames, 9)).toBe(0);
        expect(secondsBeforeNow([], 0)).toBe(0);
    });
});
