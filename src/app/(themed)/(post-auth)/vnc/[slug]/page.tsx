"use client";

import React, { useEffect } from "react";
import { useRef } from "react";
import { VncScreenHandle } from "react-vnc";

import { useAuth } from "@/components/auth-provider";
import { ClientVNC } from "@/components/client-vnc";
import { SettingsProvider } from "@/components/settings-provider";

export default function VncPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { setShowMentorAccessBar } = useAuth();
    const vncRef = useRef<VncScreenHandle>(null);
    const { slug } = React.use(params);

    useEffect(() => setShowMentorAccessBar(false), [setShowMentorAccessBar]);

    return (
        <SettingsProvider hostname={slug as string}>
            <ClientVNC height={1080} vncRef={vncRef} width={1920} />
        </SettingsProvider>
    );
}
