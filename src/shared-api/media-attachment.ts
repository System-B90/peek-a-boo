/*
 * Attachment handling shared by the tweet route and the Mattermost client.
 *
 * Tweets used to carry a PNG screenshot only. Screen recordings (issue #14)
 * send a short video through the same path, so the data-URI parsing and the
 * filename/extension choice live here — pure, and testable without a
 * Mattermost server (see tests/backend/media-attachment.test.ts).
 */

import { ClientApiError } from "@/shared-api/errors";

const DATA_URI_PATTERN = /^data:(.+);base64,(.+)$/;

/**
 * Extensions for the content types the tweet path can produce: PNG from
 * `rfb.toDataURL`, and whatever the browser's MediaRecorder picked for a
 * screen recording. Unknown-but-allowed types fall back to the subtype.
 */
const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
};

export type MediaAttachment = {
    /** Raw bytes, base64-encoded (the data-URI payload). */
    data64: string;
    contentType: string;
    filename: string;
};

/**
 * Parse a base64 data URI into the pieces Mattermost's file upload needs.
 *
 * Throws `ClientApiError` for anything that is not a base64 data URI of an
 * image or a video — the upload endpoint would otherwise happily accept
 * arbitrary content types from the browser.
 */
export function parseMediaAttachment(dataUri: string): MediaAttachment {
    const matches = dataUri.match(DATA_URI_PATTERN);
    if (!matches) {
        throw new ClientApiError(
            "Mattermost sendMessage API accepts Base64 encoded media only!",
        );
    }

    // `codecs=...` parameters ride along on MediaRecorder output.
    const contentType = matches[1];
    const mimeType = contentType.split(";")[0].trim().toLowerCase();
    const [ type, subtype ] = mimeType.split("/");

    if ((type !== "image" && type !== "video") || !subtype) {
        throw new ClientApiError(
            `Unsupported attachment type "${mimeType}"! Only images and videos may be attached.`,
        );
    }

    const extension = EXTENSION_BY_CONTENT_TYPE[mimeType] ?? subtype;

    return {
        contentType: mimeType,
        data64: matches[2],
        filename: `${type === "video" ? "recording" : "image"}.${extension}`,
    };
}
