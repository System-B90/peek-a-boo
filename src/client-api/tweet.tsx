import { safeApiFetcher } from "@/client-api/common-utils";

export async function sendTweet({
    message,
    attachment,
}: {
    message: string;
    /** Base64 data URI of a screenshot or a screen recording. */
    attachment?: string;
}) {
    await safeApiFetcher(`/api/tweet`, {
        method: "POST",
        body: JSON.stringify({ message, attachment }),
    });
}
