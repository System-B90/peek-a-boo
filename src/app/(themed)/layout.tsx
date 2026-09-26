"use client";

import "@/style/globals.css";
import { ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { Suspense } from "react";

import { QueryParamsProvider } from "@/components/query-params-provider";
import { darkTheme } from "@/components/theme";

export default function ThemeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ThemeProvider theme={darkTheme}>
            <Suspense>
                <SnackbarProvider
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                    }}
                >
                    <QueryParamsProvider>{children}</QueryParamsProvider>
                </SnackbarProvider>
            </Suspense>
        </ThemeProvider>
    );
}
