/*
 * captureReplayFrame() touches the DOM, but everything worth pinning — the
 * downscale, the reused scratch canvas, the byte estimate, and refusing to
 * encode a framebuffer that has no size yet — is bookkeeping around it, so it
 * is exercised here against a fake canvas.
 */
import { describe, expect, it, vi } from "vitest";

import { captureReplayFrame } from "@/components/instant-replay";
import {
    INSTANT_REPLAY_FRAME_QUALITY,
    INSTANT_REPLAY_FRAME_TYPE,
    INSTANT_REPLAY_MAX_WIDTH,
} from "@/shared-api/instant-replay";

type DrawCall = Array<number>;

function fakeCanvas(width: number, height: number, dataUri = "data:image/jpeg;base64,AAAA") {
    const drawCalls: Array<DrawCall> = [];
    const context = {
        drawImage: (_source: unknown, ...args: DrawCall) =>
            drawCalls.push(args),
    };
    const canvas = {
        width,
        height,
        drawCalls,
        getContext: vi.fn(() => context),
        toDataURL: vi.fn(() => dataUri),
    };
    return canvas as unknown as HTMLCanvasElement & typeof canvas;
}

describe("captureReplayFrame", () => {
    it("downscales the framebuffer into the scratch canvas", () => {
        const source = fakeCanvas(1920, 1080);
        const scratch = fakeCanvas(0, 0);

        const frame = captureReplayFrame(source, scratch, 1234);

        expect(scratch.width).toBe(INSTANT_REPLAY_MAX_WIDTH);
        expect(scratch.height).toBe(360);
        expect(scratch.drawCalls).toEqual([[ 0, 0, INSTANT_REPLAY_MAX_WIDTH, 360 ]]);
        expect(frame?.timestamp).toBe(1234);
        expect(frame?.dataUri).toBe("data:image/jpeg;base64,AAAA");
        expect(frame?.bytes).toBe(3);
    });

    it("encodes as a compressed frame, not a full-size PNG", () => {
        const scratch = fakeCanvas(0, 0);
        captureReplayFrame(fakeCanvas(800, 600), scratch, 0);

        expect(scratch.toDataURL).toHaveBeenCalledWith(
            INSTANT_REPLAY_FRAME_TYPE,
            INSTANT_REPLAY_FRAME_QUALITY,
        );
    });

    it("reuses the scratch canvas instead of resizing it every capture", () => {
        const source = fakeCanvas(1920, 1080);
        const scratch = fakeCanvas(0, 0);

        captureReplayFrame(source, scratch, 0);
        const resized = scratch.width;
        captureReplayFrame(source, scratch, 250);

        expect(scratch.width).toBe(resized);
        expect(scratch.drawCalls).toHaveLength(2);
    });

    it("captures nothing while the framebuffer has no size", () => {
        const scratch = fakeCanvas(0, 0);

        expect(captureReplayFrame(fakeCanvas(0, 0), scratch, 0)).toBeNull();
        expect(scratch.toDataURL).not.toHaveBeenCalled();
    });

    it("captures nothing when the canvas yields no 2d context", () => {
        const scratch = fakeCanvas(0, 0);
        scratch.getContext = vi.fn(() => null) as unknown as typeof scratch.getContext;

        expect(captureReplayFrame(fakeCanvas(800, 600), scratch, 0)).toBeNull();
    });

    it("captures nothing when the canvas refuses to encode", () => {
        // A tainted canvas returns "data:," rather than throwing in some
        // browsers — buffering that would fill the window with blank frames.
        const scratch = fakeCanvas(0, 0, "data:,");

        expect(captureReplayFrame(fakeCanvas(800, 600), scratch, 0)).toBeNull();
    });
});
