"use client";
import SearchIcon from "@mui/icons-material/Search";
import { useCommandPalette } from "@system-b90/command-palette";

import { Glypher } from "@/glyphs/glypher";

/**
 * The mouse affordance for the command palette, styled to sit with the other
 * glyphs in the mentor access bar. Without it the palette is discoverable only
 * by already knowing the shortcut.
 */
export function CommandPaletteButton() {
    const { open } = useCommandPalette();

    return (
        <Glypher
            aria-label="Open command palette"
            className="w-6 h-6 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
            glyphTitle="Search commands and students (Ctrl+K)"
            onClick={(event) => {
                event.stopPropagation();
                open(null);
            }}
            role="button"
        >
            <SearchIcon className="w-6 h-6" />
        </Glypher>
    );
}
