import { execFileSync } from "child_process";
import path from "path";

import { describe, expect, inject, it } from "vitest";

// End-to-end for #101: the setup wizard takes the tweet channel's URL and
// resolves its ID through a real Mattermost's API.
const mm = inject("mattermost");
const PYTHON = process.env.PYTHON ?? "python";
const SETUP = path.resolve(__dirname, "../../scripts/setup.py");

/** Runs setup.py's resolver in a subprocess, as the wizard would. */
function resolve(url: string, token: string, channelUrl: string): string {
    const script = [
        "import importlib.util, sys",
        "spec = importlib.util.spec_from_file_location('s', sys.argv[1])",
        "m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)",
        "print(m.resolve_tweet_channel_id(*sys.argv[2:5]))",
    ].join("\n");
    return execFileSync(PYTHON, ["-c", script, SETUP, url, token, channelUrl], {
        encoding: "utf8",
    }).trim();
}

describe("setup wizard tweet channel URL (#101)", () => {
    it("resolves the channel URL a user copies from the browser", () => {
        const channelUrl = `${mm.url}/${mm.team.name}/channels/${mm.channel.name}`;
        expect(resolve("", mm.bot.token, channelUrl)).toBe(mm.channel.id);
    });

    it("resolves through MATTERMOST_URL when the public URL differs", () => {
        const channelUrl = `https://mattermost.example/${mm.team.name}/channels/${mm.channel.name}`;
        expect(resolve(mm.url, mm.bot.token, channelUrl)).toBe(mm.channel.id);
    });

    it("fails for a channel that does not exist", () => {
        const channelUrl = `${mm.url}/${mm.team.name}/channels/no-such-channel`;
        expect(() => resolve("", mm.bot.token, channelUrl)).toThrow();
    });
});
