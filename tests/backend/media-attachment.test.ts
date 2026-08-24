import { describe, expect, it } from "vitest";

import { ClientApiError } from "@/shared-api/errors";
import { parseMediaAttachment } from "@/shared-api/media-attachment";

describe("parseMediaAttachment", () => {
    it("parses a PNG screenshot data URI", () => {
        const attachment = parseMediaAttachment("data:image/png;base64,QUJD");

        expect(attachment).toEqual({
            contentType: "image/png",
            data64: "QUJD",
            filename: "image.png",
        });
    });

    it("names video attachments by their container", () => {
        expect(parseMediaAttachment("data:video/webm;base64,QUJD")).toEqual({
            contentType: "video/webm",
            data64: "QUJD",
            filename: "recording.webm",
        });
        expect(parseMediaAttachment("data:video/mp4;base64,QUJD").filename).toBe(
            "recording.mp4",
        );
    });

    it("strips MediaRecorder codec parameters from the content type", () => {
        // MediaRecorder reports `video/webm;codecs=vp9`; Mattermost wants the
        // bare type, and the filename must still end up .webm.
        const attachment = parseMediaAttachment(
            "data:video/webm;codecs=vp9;base64,QUJD",
        );

        expect(attachment.contentType).toBe("video/webm");
        expect(attachment.filename).toBe("recording.webm");
    });

    it("falls back to the MIME subtype for unlisted media types", () => {
        expect(parseMediaAttachment("data:video/ogg;base64,QUJD").filename).toBe(
            "recording.ogg",
        );
    });

    it("rejects values that are not base64 data URIs", () => {
        expect(() => parseMediaAttachment("https://example.com/cat.png")).toThrow(
            ClientApiError,
        );
    });

    it("rejects non-media content types", () => {
        expect(() =>
            parseMediaAttachment("data:text/html;base64,QUJD"),
        ).toThrow(ClientApiError);
    });
});
