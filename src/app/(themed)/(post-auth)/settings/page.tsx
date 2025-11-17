"use client";

import SettingsForm from "@/app/(themed)/(post-auth)/settings/settings-form";
import VNCClientAdministrationPane from "@/app/(themed)/(post-auth)/settings/vnc-admin-pane";
import { Paper, Box, Typography } from "@mui/material";
import { ReactNode } from "react";

function Pane({ title, children }: { title: string; children: ReactNode; })
{
    return (
        <div className="w-full h-full flex justify-center p-2 min-w-0 flex-1">
            <Paper className="w-full p-6" elevation={ 3 }>
                <Typography variant="h5" className="mb-4 font-bold">
                    { title }
                </Typography>

                <Box sx={ { height: "1.5rem" } } />

                { children }
            </Paper>
        </div>
    );
}


export default function Page()
{

    return (
        <div
            style={ {
                display: "flex",
                flexDirection: "row",
                width: "100%",
                height: "100%",
                padding: "1rem",
                gap: "1rem",
            } }
        >
            {/* LEFT PANE — Settings */ }
            <Pane title={ "Peek-a-Boo Settings" }>
                <SettingsForm />
            </Pane>

            {/* RIGHT PANE — Client Administration */ }
            <Pane title={ "Client Administration" }>
                <VNCClientAdministrationPane />
            </Pane>
        </div>
    );
}
