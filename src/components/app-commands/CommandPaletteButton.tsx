"use client";
import SearchIcon from "@mui/icons-material/Search";
import { useCommandPalette } from "@system-b90/command-palette";

/**
 * The mouse affordance for the command palette, styled to sit with the other
 * glyphs in the mentor access bar. Without it the palette is discoverable only
 * by already knowing the shortcut.
 */
export function CommandPaletteButton() {
    const { open } = useCommandPalette();

    return (
        <button
            aria-label="Open command palette"
            className="w-6 h-6 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
            onClick={(event) => {
                event.stopPropagation();
                open(null);
            }}
            title="Search commands and students (Ctrl+K)"
            type="button"
        >
            <SearchIcon className="w-6 h-6" />
        </button>
    );
}
