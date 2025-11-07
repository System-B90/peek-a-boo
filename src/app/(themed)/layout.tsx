'use client'

import "@/style/globals.css";
import { createTheme, ThemeProvider } from "@mui/material";
import { Suspense } from "react";

const darkTheme = createTheme({
    palette: { mode: 'dark', },
})

export default function ThemeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ThemeProvider theme={darkTheme}>
            <Suspense>
                {children}
            </Suspense>
        </ThemeProvider>
    );
}
