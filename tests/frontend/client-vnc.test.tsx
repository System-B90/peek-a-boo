// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef, forwardRef, useImperativeHandle } from "react";
import type { VncScreenHandle } from "react-vnc";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClientVNC } from "@/components/client-vnc";
import { enqueueSnackbarWithSubtext } from "@/components/snackbar-utils";

const handle = {
    connect: vi.fn(),
    sendCredentials: vi.fn(),
};
let screenProps: Record<string, unknown> = {};

// next/dynamic would load react-vnc (noVNC) lazily; a stub screen records its
// props and exposes the imperative handle instead.
vi.mock("next/dynamic", () => ({
    default: () =>
        forwardRef<unknown, Record<string, unknown>>(function StubVnc(props, ref) {
            screenProps = props;
            useImperativeHandle(ref, () => handle);
            return <div data-testid="vnc-screen" />;
        }),
}));
vi.mock("@/components/auth-provider", () => ({
    useAuth: () => ({ vncClientPassword: "s3cret" }),
}));
vi.mock("@/components/settings-provider", () => ({
    useSettings: () => ({ wsProxyUrl: "wss://peekaboo.test/ws?token=pc-1" }),
}));
vi.mock("@/components/snackbar-utils", () => ({
    enqueueSnackbarWithSubtext: vi.fn(),
}));

function renderVnc(extra: Record<string, unknown> = {}) {
    const vncRef = createRef<null | VncScreenHandle>();
    return render(
        <ClientVNC height={100} vncRef={vncRef} width={200} {...extra} />,
    );
}

beforeEach(() => {
    vi.useFakeTimers();
    handle.connect.mockReset();
    handle.sendCredentials.mockReset();
    vi.mocked(enqueueSnackbarWithSubtext).mockReset();
    screenProps = {};
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("ClientVNC", () => {
    it("points the screen at the websocket proxy with the client password", () => {
        renderVnc();

        expect(screenProps.url).toBe("wss://peekaboo.test/ws?token=pc-1");
        expect(screenProps.autoConnect).toBe(false);
        expect(screenProps.viewOnly).toBe(true);
        expect(screenProps.rfbOptions).toMatchObject({
            shared: true,
            credentials: { password: "s3cret" },
        });
    });

    it("connects once, a second after mounting", async () => {
        renderVnc();
        expect(handle.connect).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(1000);
        });
        expect(handle.connect).toHaveBeenCalledTimes(1);
    });

    it("shows a connection error with a working retry when no canvas appears", async () => {
        renderVnc();
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText("Connection Error")).toBeTruthy();
        fireEvent.click(screen.getByText("Retry"));
        expect(handle.connect).toHaveBeenCalledTimes(2);
    });

    it("reports an unclean disconnect but not a clean one", () => {
        const onDisconnect = vi.fn();
        renderVnc({ onDisconnect });
        const disconnect = screenProps.onDisconnect as (e: unknown) => void;

        disconnect({ detail: { clean: true } });
        expect(enqueueSnackbarWithSubtext).not.toHaveBeenCalled();
        disconnect({ detail: { clean: false } });
        expect(enqueueSnackbarWithSubtext).toHaveBeenCalledTimes(1);
        expect(onDisconnect).toHaveBeenCalledTimes(2);
    });

    // Regression: the handler logged the VNC password to the browser console.
    it("resends credentials on a security failure without logging the password", () => {
        const log = vi.spyOn(console, "error").mockImplementation(() => {});
        const onSecurityFailure = vi.fn();
        renderVnc({ onSecurityFailure });

        (screenProps.onSecurityFailure as (e: unknown) => void)({});

        expect(handle.sendCredentials).toHaveBeenCalledWith({
            password: "s3cret",
            target: "",
            username: "",
        });
        expect(onSecurityFailure).toHaveBeenCalled();
        expect(JSON.stringify(log.mock.calls)).not.toContain("s3cret");
    });

    // Regression: the canvas watchdog interval was never cleared on unmount.
    it("stops its timers when unmounted", () => {
        const { unmount } = renderVnc();
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});
