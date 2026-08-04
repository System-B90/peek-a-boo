"use client";
import LogoutIcon from "@mui/icons-material/Logout";
import { useCommands } from "@system-b90/command-palette";
import { useMemo } from "react";

import { COMMAND_GROUPS } from "@/components/app-commands/labels";
import { useAuth } from "@/components/auth-provider";

/**
 * Session actions that need nothing but `AuthProvider`.
 *
 * "Reload all" and "close all screens" belong here conceptually but read the
 * student providers, which sit below the palette — they are contributed by
 * `StudentCommands` instead.
 */
export function useSessionCommands(): void {
    const { displayName } = useAuth();

    const commands = useMemo(
        () => [
            {
                id: "session.logout",
                title: "Log out",
                subtitle: displayName,
                group: COMMAND_GROUPS.session,
                icon: <LogoutIcon />,
                keywords: ["logout", "log out", "sign out", "exit"],
                // Logging out by mistyping into a search box would be a nasty
                // surprise, so keep it off the no-query default list.
                priority: -1,
                run: () => globalThis.location.replace("/api/logout"),
            },
        ],
        [displayName],
    );

    useCommands(commands);
}
