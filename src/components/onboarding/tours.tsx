import type { HelpTopic, Tour } from "@system-b90/onboarding";

/**
 * Every anchor a tour may point at. Components mark themselves with
 * `<TourAnchor id={ANCHORS.x}>`; tours reference the same constants, so a
 * renamed anchor is a type error rather than a step pointing at nothing.
 */
export const ANCHORS = {
    accessBar: "header.access-bar",
    palette: "header.palette",
    settingsLink: "header.settings",
    help: "header.help",
    drawer: "home.drawer",
    grid: "home.grid",
    settingsForm: "settings.form",
    clientAdmin: "settings.client-admin",
} as const;

export const HOME_TOUR = {
    id: "home.intro",
    title: "Welcome to Peek-a-Boo",
    version: 1,
    autoStart: true,
    steps: [
        {
            id: "welcome",
            title: "Welcome to Peek-a-Boo",
            body: "Watch your students' screens live, replay what just happened, and tweet to Mattermost. This short tour shows where everything is.",
            placement: "center",
        },
        {
            id: "drawer",
            title: "Your students",
            body: "Open the menu to see your mentees. Click a student to show or hide their screen in the grid, and use the search bar and tags to filter.",
            anchor: ANCHORS.drawer,
            placement: "inline-end",
        },
        {
            id: "grid",
            title: "Live screens",
            body: "Each tile is a live VNC view of a student's PC. A tile's buttons give you fullscreen, an instant replay of the last seconds, screen recording, and a tweet.",
            anchor: ANCHORS.grid,
            placement: "center",
            optional: true,
        },
        {
            id: "palette",
            title: "Command palette",
            body: "Press Ctrl+K, or click here, to jump to any student or command.",
            anchor: ANCHORS.palette,
            placement: "block-end",
            interactive: true,
        },
        {
            id: "settings",
            title: "Settings",
            body: "Hive, VNC and Mattermost settings live here.",
            anchor: ANCHORS.settingsLink,
            placement: "block-end",
            optional: true,
        },
        {
            id: "help",
            title: "Help is always here",
            body: "Open help to replay this tour or read about shortcuts, replay and recording.",
            anchor: ANCHORS.help,
            placement: "block-end",
        },
    ],
} as const satisfies Tour;

export const SETTINGS_TOUR = {
    id: "settings.intro",
    title: "Settings",
    version: 1,
    autoStart: true,
    steps: [
        {
            id: "form",
            title: "Peek-a-Boo settings",
            body: "Connection details for Hive, the VNC passwords and the Mattermost tweet channel. Saving applies them immediately.",
            anchor: ANCHORS.settingsForm,
            placement: "inline-end",
        },
        {
            id: "client-admin",
            title: "Client administration",
            body: "Download the VNC client installer for student PCs.",
            anchor: ANCHORS.clientAdmin,
            placement: "inline-start",
        },
    ],
} as const satisfies Tour;

export const TOURS = [HOME_TOUR, SETTINGS_TOUR] as const;

export const HELP_TOPICS = [
    {
        id: "tour.home",
        title: "Take the tour",
        body: "A walk through the student list, live screens and the toolbar.",
        group: "Getting started",
        order: 0,
        tourId: HOME_TOUR.id,
    },
    {
        id: "tour.settings",
        title: "Settings tour",
        body: "What each settings section does. Open Settings to start it.",
        group: "Getting started",
        order: 1,
        tourId: SETTINGS_TOUR.id,
    },
    {
        id: "shortcuts",
        title: "Keyboard shortcuts",
        body: "Ctrl+K opens the command palette. In the student list, Enter or Space toggles the focused student.",
        group: "Features",
        order: 0,
    },
    {
        id: "replay",
        title: "Instant replay",
        body: "The replay button on a tile shows the last seconds of that student's screen, so you can see what just happened.",
        group: "Features",
        order: 1,
    },
    {
        id: "recording",
        title: "Screen recording and tweets",
        body: "Record a student's screen from its tile, then send the recording or a message to the Mattermost tweet channel.",
        group: "Features",
        order: 2,
    },
] as const satisfies ReadonlyArray<HelpTopic>;
