import { readFileSync } from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

const pkg = JSON.parse(
    readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
) as { devDependencies: Record<string, string> };

// Regression for #84: package.json pinned the deprecated eslint@9, held back
// by plugins that never supported ESLint 10.
describe("ESLint version (#84)", () => {
    it("requires a supported ESLint major", () => {
        const major = Number(/\d+/.exec(pkg.devDependencies.eslint ?? "")?.[0]);
        expect(major).toBeGreaterThanOrEqual(10);
    });

    it.each(["eslint-plugin-react", "eslint-plugin-import", "eslint-config-next"])(
        "does not depend on %s, which blocks ESLint 10",
        (name) => {
            expect(pkg.devDependencies).not.toHaveProperty(name);
        },
    );
});
