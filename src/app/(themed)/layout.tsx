"use client";

import "@/style/globals.css";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { Suspense } from "react";

import { QueryParamsProvider } from "@/components/query-params-provider";

const darkTheme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#bb86fc" },
        secondary: { main: "#240B42" },
        success: { main: "#A2FCBA" },
        error: { main: "#FF6E6E" },
        warning: { main: "#FFD966" },
    },
    direction: "rtl",
    cssVariables: true,
});

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
