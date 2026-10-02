import { type MattermostFixture, setupMattermost } from "@system-b90/test-kit/mattermost";
import type { TestProject } from "vitest/node";

declare module "vitest" {
    // Module augmentation only works with an interface.
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    export interface ProvidedContext {
        mattermost: MattermostFixture;
    }
}

// One throwaway Mattermost for the whole run (see @system-b90/test-kit's
// README for MATTERMOST_TEST_URL / MATTERMOST_TEST_KEEP to reuse one locally).
export async function setup({ provide }: TestProject) {
    const { fixture, teardown } = await setupMattermost({
        projectName: "peekaboo-mattermost-it",
    });
    provide("mattermost", fixture);
    return teardown;
}
