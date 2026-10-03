"use client";
import { OnboardingProvider, useHelpTopics } from "@system-b90/onboarding";
import { EN_LABELS } from "@system-b90/onboarding/en";
import { ReactNode } from "react";

import { HELP_TOPICS } from "@/components/onboarding/tours";

function HelpTopics(): null {
    useHelpTopics(HELP_TOPICS);

    return null;
}

/**
 * Tours never start on their own under automation (Playwright sets
 * `navigator.webdriver`): an overlay would block every other e2e test. They
 * can still be started from the help drawer.
 */
export function shouldAutoStartTours(): boolean {
    return typeof navigator === "undefined" || !navigator.webdriver;
}

/** Guided tours and the help drawer (@system-b90/onboarding), app-wide. */
export function PeekABooOnboarding({ children }: { children: ReactNode }) {
    return (
        <OnboardingProvider
            autoStart={shouldAutoStartTours()}
            labels={EN_LABELS}
            storageNamespace="peekaboo"
        >
            <HelpTopics />
            {children}
        </OnboardingProvider>
    );
}
