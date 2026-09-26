import { createTheme } from "@mui/material/styles";

/** Peek-a-boo's one theme, shared by the themed layout and the root 404. */
export const darkTheme = createTheme({
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
