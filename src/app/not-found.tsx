"use client";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { ThemeProvider } from "@mui/material/styles";

import { StatusCard } from "@/components/status-card";
import { darkTheme } from "@/components/theme";

/**
 * Replaces Next's built-in 404, which renders English and unthemed. Lives at
 * the app root (outside the themed layout) so it also covers URLs that never
 * reach a route group, hence its own ThemeProvider.
 */
export default function NotFound() {
    return (
        <ThemeProvider theme={darkTheme}>
            <StatusCard
                actions={[{ label: "חזרה לדף הבית", href: "/", variant: "contained" }]}
                description="הקישור שגוי, או שהדף הועבר או נמחק."
                details="404"
                icon={<SearchOffIcon />}
                title="הדף לא נמצא"
            />
        </ThemeProvider>
    );
}
