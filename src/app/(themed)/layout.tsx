'use client';

import { QueryParamsProvider } from "@/components/query-params-provider";
import "@/style/globals.css";
import { createTheme, ThemeProvider } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense } from "react";

const darkTheme = createTheme({
    palette: { mode: 'dark', },
});

export default function ThemeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>)
{
    return (
        <ThemeProvider theme={ darkTheme }>
            <Suspense>
                <SnackbarProvider
                    anchorOrigin={ {
                        vertical: 'bottom',
                        horizontal: 'right',
                    } }>
                    <QueryParamsProvider>
                        { children }
                    </QueryParamsProvider>
                </SnackbarProvider >
            </Suspense>
        </ThemeProvider>
    );
}
