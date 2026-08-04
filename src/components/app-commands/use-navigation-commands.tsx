"use client";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import GroupIcon from "@mui/icons-material/Group";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import { useCommands } from "@system-b90/command-palette";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useMemo } from "react";

import { COMMAND_GROUPS } from "@/components/app-commands/labels";

type Destination = {
    id: string;
    title: string;
    href: string;
    icon: ReactNode;
    keywords: Array<string>;
};

const DESTINATIONS: Array<Destination> = [
    {
        id: "goto.home",
        title: "Home",
        href: "/",
        icon: <HomeIcon />,
        keywords: ["home", "grid", "students", "dashboard"],
    },
    {
        id: "goto.mentees",
        title: "My mentees",
        href: "/mentees",
        icon: <GroupIcon />,
        keywords: ["mentees", "mine", "my students", "mentor"],
    },
    {
        id: "goto.settings",
        title: "Settings",
        href: "/settings",
        icon: <SettingsIcon />,
        keywords: ["settings", "preferences", "config", "options"],
    },
    {
        id: "goto.fullscreen",
        title: "Fullscreen",
        href: "/fullscreen",
        icon: <FullscreenIcon />,
        keywords: ["fullscreen", "present", "wall", "display"],
    },
];

/** Top-level page navigation. Registered app-wide. */
export function useNavigationCommands(): void {
    const router = useRouter();
    const pathname = usePathname();

    const commands = useMemo(
        () =>
            DESTINATIONS.map((destination) => ({
                id: destination.id,
                title: `Go to ${destination.title}`,
                subtitle: destination.href,
                group: COMMAND_GROUPS.navigation,
                kind: "goto" as const,
                icon: destination.icon,
                keywords: destination.keywords,
                // Already here — show it, but don't pretend it does anything.
                enabled: pathname !== destination.href,
                run: () => router.push(destination.href),
            })),
        [router, pathname],
    );

    useCommands(commands);
}
