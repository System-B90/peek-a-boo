"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ClientOnlyDynamic as ClientOnly } from "@/app/(themed)/(post-auth)/client-only";
import { useAuth } from "@/components/auth-provider";
import { VncCard } from "@/components/vnc-card";

export default function Fullscreen() {
    const searchParams = useSearchParams();
    const { clientEnvConfig } = useAuth();

    // Fullscreen takes a `username` search param. A `hostname` param is
    // recognised but NOT implemented -- the effect below only logs. Connecting
    // by hostname would need a lookup from host to VNC credentials that does
    // not exist yet.

    const [studentUsername] = useState<string>(
        searchParams.get("username") ?? "",
    );

    useEffect(() => {
        if (searchParams.get("hostname")) {
            console.error("Not implemented!");
        }
    }, [searchParams, clientEnvConfig]);

    return (
        <div className="w-screen h-screen m-0 p-0 flex flex-row content-center justify-center">
            <ClientOnly>
                <VncCard
                    isFullscreen={true}
                    studentUsername={studentUsername}
                />
            </ClientOnly>
        </div>
    );
}
