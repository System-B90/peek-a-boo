/*
 * recordCanvas() drives browser APIs, but the parts worth pinning — the
 * memory budget, the timeslice, and track cleanup — are plain bookkeeping, so
 * they are exercised here against fake MediaRecorder/canvas/FileReader.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { recordCanvas } from "@/components/screen-recorder";
import {
    SCREEN_RECORDING_BITS_PER_SECOND,
    SCREEN_RECORDING_CHUNK_MS,
    SCREEN_RECORDING_MAX_BYTES,
} from "@/shared-api/screen-recording";

type Listener = (event: { data: Blob }) => void;

const stoppedTracks: Array<string> = [];
let lastRecorder: FakeMediaRecorder;

class FakeMediaRecorder {
    static isTypeSupported = () => true;
    static options: MediaRecorderOptions | undefined;

    listeners: Record<string, Array<Listener>> = {};
    state: "inactive" | "recording" = "inactive";
    timeslice: number | undefined;
    mimeType = "video/webm";

    constructor(_stream: unknown, options?: MediaRecorderOptions) {
        FakeMediaRecorder.options = options;
        lastRecorder = this;
    }

    addEventListener(name: string, listener: Listener) {
        (this.listeners[name] ??= []).push(listener);
    }

    emit(name: string, event: unknown = {}) {
        this.listeners[name]?.forEach((listener) =>
            listener(event as { data: Blob }),
        );
    }

    start(timeslice?: number) {
        this.timeslice = timeslice;
        this.state = "recording";
    }

    stop() {
        this.state = "inactive";
        this.emit("stop");
    }
}

let readerReads = 0;

class FakeFileReader {
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;
    result: null | string = null;

    readAsDataURL(blob: Blob) {
        readerReads += 1;
        this.result = `data:${blob.type};base64,QUJD`;
        this.onload?.();
    }
}

function fakeCanvas() {
    return {
        captureStream: () => ({
            getTracks: () => [
                { stop: () => stoppedTracks.push("video") },
            ],
        }),
    } as unknown as HTMLCanvasElement;
}

function chunk(size: number) {
    return { data: { size, type: "video/webm" } as Blob };
}

function install() {
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("FileReader", FakeFileReader);
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    stoppedTracks.length = 0;
    readerReads = 0;
});

describe("recordCanvas", () => {
    it("caps the bitrate and requests chunks while recording", async () => {
        install();
        vi.useFakeTimers();

        const promise = recordCanvas(fakeCanvas(), 10_000);
        expect(FakeMediaRecorder.options?.videoBitsPerSecond).toBe(
            SCREEN_RECORDING_BITS_PER_SECOND,
        );
        expect(lastRecorder.timeslice).toBe(SCREEN_RECORDING_CHUNK_MS);

        lastRecorder.emit("dataavailable", chunk(1024));
        vi.advanceTimersByTime(10_000);

        await expect(promise).resolves.toContain("data:video/webm;base64,");
    });

    it("stops early once the buffered clip hits the memory budget", async () => {
        install();
        vi.useFakeTimers();

        const promise = recordCanvas(fakeCanvas(), 10_000);
        lastRecorder.emit("dataavailable", chunk(SCREEN_RECORDING_MAX_BYTES));

        // Stopped without waiting out the requested duration.
        expect(lastRecorder.state).toBe("inactive");
        await expect(promise).resolves.toContain("data:video/webm;base64,");

        // The duration timer must not fire a second stop afterwards.
        vi.advanceTimersByTime(10_000);
        expect(stoppedTracks).toHaveLength(1);
    });

    it("releases the capture tracks when recording ends", async () => {
        install();
        const promise = recordCanvas(fakeCanvas(), 10_000);
        lastRecorder.emit("dataavailable", chunk(10));
        lastRecorder.stop();

        await promise;
        expect(stoppedTracks).toHaveLength(1);
    });

    it("rejects when no data was captured", async () => {
        install();
        const promise = recordCanvas(fakeCanvas(), 10_000);
        lastRecorder.stop();

        await expect(promise).rejects.toThrow("produced no data");
        expect(stoppedTracks).toHaveLength(1);
    });

    it("discards the clip and stops the capture when aborted", async () => {
        install();
        const controller = new AbortController();

        const promise = recordCanvas(fakeCanvas(), 10_000, controller.signal);
        lastRecorder.emit("dataavailable", chunk(1024));
        controller.abort();

        await expect(promise).rejects.toThrow("cancelled");
        expect(lastRecorder.state).toBe("inactive");
        expect(stoppedTracks).toHaveLength(1);
        // The stop event that follows stop() must not encode the discarded
        // clip on top of the rejection.
        expect(readerReads).toBe(0);
    });

    it("rejects immediately when the signal is already aborted", async () => {
        install();

        await expect(
            recordCanvas(fakeCanvas(), 10_000, AbortSignal.abort()),
        ).rejects.toThrow("cancelled");
        expect(readerReads).toBe(0);
    });

    it("rejects when the browser cannot record", async () => {
        vi.stubGlobal("MediaRecorder", undefined);

        await expect(recordCanvas(fakeCanvas(), 10_000)).rejects.toThrow(
            "not supported",
        );
    });
});
