"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { ReactNode } from "react";

import { SettingsForm } from "@/app/(themed)/(post-auth)/settings/settings-form";
import { VNCClientAdministrationPane } from "@/app/(themed)/(post-auth)/settings/vnc-admin-pane";

function Pane({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="w-full h-full flex justify-center p-2 min-w-0 flex-1">
            <Paper className="w-full p-6" elevation={3}>
                <Typography className="mb-4 font-bold" variant="h5">
                    {title}
                </Typography>

                <Box sx={{ height: "1.5rem" }} />

                {children}
            </Paper>
        </div>
    );
}

export default function Page() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                height: "100%",
                padding: "1rem",
                gap: "1rem",
            }}
        >
            {/* LEFT PANE — Settings */}
            <Pane title={"Peek-a-Boo Settings"}>
                <SettingsForm />
            </Pane>

            {/* RIGHT PANE — Client Administration */}
            <Pane title={"Client Administration"}>
                <VNCClientAdministrationPane />

                <Box sx={{ height: "1.5rem" }} />

                <Typography variant="body2">
                    Want to help improve Peek-a-Boo?{" "}
                    <a
                        className="underline"
                        href="https://github.com/System-B90/peek-a-boo#contributing"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Learn how to contribute
                    </a>
                    .
                </Typography>
            </Pane>
        </div>
    );
}
