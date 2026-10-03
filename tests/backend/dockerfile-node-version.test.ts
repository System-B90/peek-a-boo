import { readFileSync } from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

const read = (file: string) =>
    readFileSync(path.join(process.cwd(), file), "utf8");

/** The Node major CI runs on (`actions/setup-node` in ci.yml). */
function ciNodeMajor(): number {
    const match = /node-version:\s*"?(\d+)/.exec(read(".github/workflows/ci.yml"));
    return Number(match?.[1]);
}

// Regression for #96: the image shipped on end-of-life Node 20 while CI tested
// on Node 24.
describe("Dockerfile Node version (#96)", () => {
    const stages = [...read("Dockerfile").matchAll(/^FROM node:(\d+)/gm)].map(
        (m) => Number(m[1]),
    );

    it("has node stages", () => {
        expect(stages.length).toBeGreaterThan(0);
    });

    it("builds every stage on the Node major CI tests", () => {
        for (const major of stages) expect(major).toBe(ciNodeMajor());
    });

    it("never uses an end-of-life Node release", () => {
        for (const major of stages) expect(major).toBeGreaterThanOrEqual(22);
    });
});
