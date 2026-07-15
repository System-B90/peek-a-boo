import { safeApiFetcher } from "@/client-api/common-utils";

export async function sendTweet({
    message,
    screenShotData,
}: {
    message: string;
    screenShotData?: string;
}) {
    await safeApiFetcher(`/api/tweet`, {
        method: "POST",
        body: JSON.stringify({ message, image: screenShotData }),
    });
}
