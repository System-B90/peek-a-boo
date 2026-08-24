/*
 * Attachment handling shared by the tweet route and the Mattermost client.
 *
 * Tweets used to carry a PNG screenshot only. Screen recordings (issue #14)
 * send a short video through the same path, so the data-URI parsing and the
 * filename/extension choice live here — pure, and testable without a
 * Mattermost server (see tests/backend/media-attachment.test.ts).
 */

import { ClientApiError } from "@/shared-api/errors";

const DATA_URI_PREFIX = "data:";
const BASE64_MARKER = ";base64,";

/**
 * Longest plausible data-URI header (`data:<type>;<params>;base64,`).
 *
 * The payload can be megabytes of video, so the header is located by scanning
 * this bounded prefix instead of running a regex — `/^data:(.+);base64,(.+)$/`
 * backtracks across the whole payload and copies it into a capture group.
 */
const MAX_HEADER_LENGTH = 256;

/**
 * Largest attachment the tweet path will forward to Mattermost (12 MB decoded).
 *
 * Recordings are already budgeted client-side, but the route takes whatever a
 * caller posts: without a ceiling here, one request can pin an arbitrary
 * amount of server memory (the JSON body, the decoded buffer, and the Blob).
 */
export const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024;

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
    const markerIndex = dataUri
        .slice(0, MAX_HEADER_LENGTH)
        .indexOf(BASE64_MARKER);
    // Validate before slicing: copying the payload out of a value that turns
    // out to be malformed is exactly the allocation this parser avoids.
    if (
        markerIndex <= DATA_URI_PREFIX.length ||
        !dataUri.startsWith(DATA_URI_PREFIX) ||
        dataUri.length === markerIndex + BASE64_MARKER.length
    ) {
        throw new ClientApiError(
            "Mattermost sendMessage API accepts Base64 encoded media only!",
        );
    }
    const data64 = dataUri.slice(markerIndex + BASE64_MARKER.length);

    // `codecs=...` parameters ride along on MediaRecorder output.
    const contentType = dataUri.slice(DATA_URI_PREFIX.length, markerIndex);
    const mimeType = contentType.split(";")[0].trim().toLowerCase();
    const [ type, subtype ] = mimeType.split("/");

    if ((type !== "image" && type !== "video") || !subtype) {
        throw new ClientApiError(
            `Unsupported attachment type "${mimeType}"! Only images and videos may be attached.`,
        );
    }

    const decodedBytes = decodedBase64Length(data64);
    if (decodedBytes > MAX_ATTACHMENT_BYTES) {
        throw new ClientApiError(
            `Attachment is too large (${Math.round(decodedBytes / 1024 / 1024)} MB)! The limit is ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB.`,
        );
    }

    const extension = EXTENSION_BY_CONTENT_TYPE[mimeType] ?? subtype;

    return {
        contentType: mimeType,
        data64,
        filename: `${type === "video" ? "recording" : "image"}.${extension}`,
    };
}

/**
 * Decoded byte count of a base64 payload, computed from its length so the
 * size check does not have to allocate the decoded buffer first.
 */
export function decodedBase64Length(data64: string): number {
    const padding = data64.endsWith("==") ? 2 : data64.endsWith("=") ? 1 : 0;
    return Math.floor((data64.length * 3) / 4) - padding;
}
