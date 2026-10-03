import { afterEach, describe, expect, it, vi } from "vitest";

import { shouldAutoStartTours } from "@/components/onboarding/peekaboo-onboarding";
import { ANCHORS, HELP_TOPICS, TOURS } from "@/components/onboarding/tours";

const anchorIds = new Set<string>(Object.values(ANCHORS));

describe("onboarding tours (#97)", () => {
    it("points every anchored step at a declared anchor", () => {
        for (const tour of TOURS) {
            for (const step of tour.steps) {
                if ("anchor" in step) expect(anchorIds).toContain(step.anchor);
            }
        }
    });

    it("uses unique tour and step ids", () => {
        const tourIds = TOURS.map((t) => t.id);
        expect(new Set(tourIds).size).toBe(tourIds.length);
        for (const tour of TOURS) {
            const stepIds = tour.steps.map((s) => s.id);
            expect(new Set(stepIds).size).toBe(stepIds.length);
        }
    });

    it("only offers to replay tours that exist", () => {
        const tourIds = new Set<string>(TOURS.map((t) => t.id));
        for (const topic of HELP_TOPICS) {
            if ("tourId" in topic) expect(tourIds).toContain(topic.tourId);
        }
    });

    it("declares anchor ids once", () => {
        expect(anchorIds.size).toBe(Object.values(ANCHORS).length);
    });
});

describe("shouldAutoStartTours", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("does not auto-start under automation", () => {
        vi.stubGlobal("navigator", { webdriver: true });
        expect(shouldAutoStartTours()).toBe(false);
    });

    it("auto-starts for a real browser", () => {
        vi.stubGlobal("navigator", { webdriver: false });
        expect(shouldAutoStartTours()).toBe(true);
    });
});
