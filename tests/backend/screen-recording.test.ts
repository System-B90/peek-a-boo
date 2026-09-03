import { describe, expect, it } from "vitest";

import {
    pickRecordingMimeType,
    RECORDING_MIME_CANDIDATES,
    SCREEN_RECORDING_SECONDS,
} from "@/shared-api/screen-recording";

describe("pickRecordingMimeType", () => {
    it("prefers the first supported candidate", () => {
        const mimeType = pickRecordingMimeType(() => true);

        expect(mimeType).toBe(RECORDING_MIME_CANDIDATES[0]);
    });

    it("falls back down the candidate list", () => {
        const mimeType = pickRecordingMimeType(
            (candidate) => candidate === "video/mp4",
        );

        expect(mimeType).toBe("video/mp4");
    });

    it("returns undefined when nothing is supported", () => {
        // MediaRecorder throws on an unsupported mimeType, so the caller must
        // be told to fall back to the browser default rather than forcing one.
        expect(pickRecordingMimeType(() => false)).toBeUndefined();
    });

    it("only offers media types the attachment parser accepts", () => {
        for (const candidate of RECORDING_MIME_CANDIDATES) {
            expect(candidate.startsWith("video/")).toBe(true);
        }
    });

    it("records a clip short enough to post", () => {
        expect(SCREEN_RECORDING_SECONDS).toBeGreaterThan(0);
        expect(SCREEN_RECORDING_SECONDS).toBeLessThanOrEqual(30);
    });
});
