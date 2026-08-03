import { withLabelOverrides } from "@system-b90/command-palette";
import { EN_LABELS } from "@system-b90/command-palette/en";

/**
 * Peek-a-boo's palette wording.
 *
 * Peek-a-boo's UI is in English (unlike Bluz and Madash), so this starts from
 * the package's English table. Importing `/en` and never `/he` is what keeps
 * the Hebrew strings out of the bundle.
 */
export const PALETTE_LABELS = withLabelOverrides(EN_LABELS, {
    placeholder: "Type a command, or search for a student…",
    kinds: {
        entity: "Students",
        goto: "Go to",
    },
});

/**
 * Section headings. Centralised so two contributors never disagree on the
 * spelling of a group and split it into two sections in the result list.
 */
export const COMMAND_GROUPS = {
    navigation: "Navigation",
    students: "Students",
    session: "Session",
} as const;
