"use client";
import { CommandPaletteProvider } from "@system-b90/command-palette";
import { ReactNode } from "react";

import { PALETTE_LABELS } from "@/components/app-commands/labels";
import { useNavigationCommands } from "@/components/app-commands/use-navigation-commands";
import { useSessionCommands } from "@/components/app-commands/use-session-commands";

/**
 * Commands available from anywhere. Deliberately limited to what `AuthProvider`
 * alone can satisfy — anything reading the student providers is contributed
 * lower down by `StudentCommands`, because those providers sit below this one.
 */
function AppCommands(): null {
    useNavigationCommands();
    useSessionCommands();

    return null;
}

/**
 * Peek-a-boo's palette. Wraps the generic package with this app's copy and its
 * app-wide commands.
 *
 * Mounted directly inside `AuthProvider`, above `MentorAccessBar`, so the
 * access bar's palette button can reach the context. The student providers are
 * below this point, which is why student commands are contributed separately.
 */
export function PeekABooCommandPalette({ children }: { children: ReactNode }) {
    return (
        <CommandPaletteProvider
            labels={PALETTE_LABELS}
            storageNamespace="peek-a-boo"
        >
            <AppCommands />
            {children}
        </CommandPaletteProvider>
    );
}
