export const dynamic = "force-dynamic";

import Box from "@mui/material/Box";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Suspense } from "react";

import { CliAuthWidget } from "@/app/(themed)/cli-auth/cli-auth-widget";
import { createHandoffCode } from "@/server-api/cli-handoff";
import { authOptions } from "@/server-api/next-auth";

type PageProps = {
    searchParams: Promise<{
        [key: string]: Array<string> | string | undefined;
    }>;
};

// Loopback callback port: 1-5 digits. Validating the shape keeps anything
// else out of the callback URL the widget navigates to or fetches.
const PORT_PATTERN = /^\d{1,5}$/;
// The CLI prints its verification code as XXXX-XXXX.
const CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/**
 * The page `peekaboo login` opens. Hands the CLI a single-use handoff code
 * for the browser's session -- never the session token itself, which the CLI
 * fetches by redeeming the code at POST /api/cli-auth/redeem.
 */
export default async function CliAuthPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const rawPort = typeof params.port === "string" ? params.port : "";
    const port = PORT_PATTERN.test(rawPort) ? rawPort : "";
    const rawCode = typeof params.code === "string" ? params.code : "";
    const code = CODE_PATTERN.test(rawCode) ? rawCode : "";

    const session = await getServerSession(authOptions);
    if (!session) {
        const query = new URLSearchParams({ code, port }).toString();
        redirect(
            `/api/cli-auth/login?next=${encodeURIComponent(`/cli-auth?${query}`)}`,
        );
    }

    const cookieStore = await cookies();
    const token =
        cookieStore.get("__Secure-next-auth.session-token")?.value ||
        cookieStore.get("next-auth.session-token")?.value ||
        "";
    const handoffCode = token ? createHandoffCode(token) : "";

    return (
        <Box
            alignItems="flex-start"
            display="flex"
            height="100vh"
            justifyContent="center"
            pt="20vh"
            width="100%"
        >
            <Suspense fallback={null}>
                <CliAuthWidget
                    code={code}
                    handoffCode={handoffCode}
                    port={port}
                />
            </Suspense>
        </Box>
    );
}
