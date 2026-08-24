import { describe, expect, it } from "vitest";

import { ClientApiError } from "@/shared-api/errors";
import {
    decodedBase64Length,
    MAX_ATTACHMENT_BYTES,
    parseMediaAttachment,
} from "@/shared-api/media-attachment";

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

    it("rejects a data URI with an empty payload", () => {
        expect(() => parseMediaAttachment("data:image/png;base64,")).toThrow(
            ClientApiError,
        );
    });

    it("rejects an oversized attachment without decoding it", () => {
        // 4 base64 chars per 3 bytes; one char past the ceiling.
        const oversized = "A".repeat(
            Math.ceil(((MAX_ATTACHMENT_BYTES + 1) * 4) / 3),
        );

        expect(() =>
            parseMediaAttachment(`data:video/webm;base64,${oversized}`),
        ).toThrow(/too large/);
    });

    it("accepts an attachment right at the ceiling", () => {
        const atLimit = "A".repeat((MAX_ATTACHMENT_BYTES * 4) / 3);

        expect(
            parseMediaAttachment(`data:video/webm;base64,${atLimit}`).filename,
        ).toBe("recording.webm");
    });

    it("ignores a base64 marker buried in the payload", () => {
        // The header is located within a bounded prefix, so a payload that
        // happens to spell ";base64," cannot move the split point.
        const attachment = parseMediaAttachment(
            `data:video/webm;base64,${"A".repeat(300)};base64,QUJD`,
        );

        expect(attachment.contentType).toBe("video/webm");
        expect(attachment.data64.startsWith("AAAA")).toBe(true);
    });
});

describe("decodedBase64Length", () => {
    it("accounts for padding", () => {
        expect(decodedBase64Length("QUJD")).toBe(3);
        expect(decodedBase64Length("QUJDRA==")).toBe(4);
        expect(decodedBase64Length("QUJDREU=")).toBe(5);
    });

    it("matches what Buffer actually decodes", () => {
        for (const text of [ "a", "ab", "abc", "abcd", "abcde" ]) {
            const encoded = Buffer.from(text).toString("base64");
            expect(decodedBase64Length(encoded)).toBe(
                Buffer.from(encoded, "base64").length,
            );
        }
    });
});
