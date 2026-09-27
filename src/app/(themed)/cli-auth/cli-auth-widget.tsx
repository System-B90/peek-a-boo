"use client";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { PeekabooIconGlyph } from "@/glyphs/peekaboo-icon";

type CliAuthWidgetProps = {
    port: string;
    code: string;
    handoffCode: string;
};

export type CliAuthStatus = "connecting" | "fallback" | "handoff" | "success";

/**
 * The loopback callback URL. Carries the verification code (proves
 * the browser talking to the CLI's server is the one this login started
 * from) and the single-use handoff code. Never the session token
 * itself: the CLI exchanges the handoff code for the token in a separate
 * HTTPS call to the Bluz server, so the token never appears in this URL, in
 * browser history, or in the argv/logs of whatever answers on the loopback
 * port.
 */
export function callbackUrl(port: string, code: string, handoffCode: string) {
    return `http://127.0.0.1:${port}/callback?code=${encodeURIComponent(code)}&handoff=${encodeURIComponent(handoffCode)}`;
}

export function CliAuthWidget({ port, code, handoffCode }: CliAuthWidgetProps) {
    const [status, setStatus] = useState<CliAuthStatus>(() => {
        return !port || !handoffCode ? "fallback" : "connecting";
    });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!port || !handoffCode) {
            return;
        }

        const controller = new AbortController();
        // Longer than the CLI's own 10s redeem timeout: the CLI answers only
        // after redeeming the code, and aborting earlier burns the single-use
        // code on a login that was still succeeding.
        const timeoutId = setTimeout(() => {
            controller.abort();
            setStatus("handoff");
        }, 12000);

        fetch(callbackUrl(port, code, handoffCode), {
            method: "GET",
            mode: "cors",
            signal: controller.signal,
        })
            .then((res) => {
                clearTimeout(timeoutId);
                // A non-ok response still proves the CLI server is reachable,
                // but it did not accept the handoff code, so manual paste is
                // the only way forward — handing off to a new tab would just
                // show the same error.
                setStatus(res.ok ? "success" : "fallback");
            })
            .catch(() => {
                // Chrome's Local Network Access check refuses an HTTPS page
                // reaching 127.0.0.1 as a subresource, and no header the CLI
                // sends back changes that — this is why login used to sit out
                // the CLI's full 60s timeout. A top-level navigation is not
                // subject to CORS or LNA, so hand off to one. It needs a user
                // gesture to survive the popup blocker, hence a button rather
                // than an automatic window.open here.
                clearTimeout(timeoutId);
                setStatus("handoff");
            });

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [port, code, handoffCode]);

    const handleHandoff = () => {
        const opened = window.open(
            callbackUrl(port, code, handoffCode),
            "_blank",
            "noopener",
        );
        if (!opened) {
            // Popup blocked despite the gesture — navigating this tab still
            // completes the login; the CLI serves a real page at the callback.
            window.location.href = callbackUrl(port, code, handoffCode);
        }
    };

    const handleCopy = async () => {
        try {
            // The manual-paste fallback copies the handoff code, never the
            // raw session token — the CLI redeems it the same way the
            // automatic path does.
            await navigator.clipboard.writeText(handoffCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy handoff code", err);
        }
    };

    return (
        <Box
            bgcolor="background.paper"
            border="1px solid"
            borderRadius="20px"
            display="flex"
            flexDirection="column"
            gap={4}
            maxWidth="448px"
            p={5}
            sx={(theme) => ({
                borderColor: "rgba(0,0,0,0.08)",
                boxShadow: "0 24px 50px rgba(0,0,0,0.15)",
                ...theme.applyStyles("dark", {
                    borderColor: "rgba(255,255,255,0.08)",
                }),
            })}
            width="100%"
        >
            {/* Header Section */}
            <Box
                alignItems="center"
                display="flex"
                flexDirection="column"
                fontSize={30}
                fontWeight="bold"
                textAlign="center"
            >
                <Box height="6rem" width="6rem">
                    <PeekabooIconGlyph glyphTitle="Peek-a-boo" />
                </Box>
                <Typography
                    color="textPrimary"
                    component="h2"
                    fontSize="inherit"
                    fontWeight="bold"
                    letterSpacing="-0.02em"
                    mt={1}
                >
                    Connect the Peek-a-boo CLI
                </Typography>
            </Box>

            {/* Verification Code Box */}
            {!!code && status !== "fallback" && (
                <Box
                    alignItems="center"
                    bgcolor="action.hover"
                    borderRadius="10px"
                    display="flex"
                    flexDirection="column"
                    gap={1}
                    p={2}
                    textAlign="center"
                >
                    <Typography color="textSecondary" variant="caption">
                        Check that the code in your terminal matches:
                    </Typography>
                    <Typography
                        color="textPrimary"
                        fontFamily="monospace"
                        fontSize="2rem"
                        fontWeight="bold"
                        letterSpacing="0.1em"
                    >
                        {code}
                    </Typography>
                </Box>
            )}

            {/* Status / Actions Area */}
            <Box
                alignItems="center"
                display="flex"
                flexDirection="column"
                gap={3}
            >
                {status === "connecting" && (
                    <>
                        <CircularProgress size={40} />
                        <Typography
                            color="textSecondary"
                            textAlign="center"
                            variant="body1"
                        >
                            Connecting to the CLI...
                        </Typography>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircleIcon
                            color="success"
                            sx={{ fontSize: 60 }}
                        />
                        <Typography
                            color="textPrimary"
                            fontWeight="bold"
                            textAlign="center"
                            variant="h6"
                        >
                            You are logged in!
                        </Typography>
                        <Typography
                            color="textSecondary"
                            textAlign="center"
                            variant="body2"
                        >
                            You can close this tab and return to the terminal.
                        </Typography>
                    </>
                )}

                {status === "handoff" && (
                    <Box width="100%">
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <AlertTitle>One more click</AlertTitle>
                            The browser blocked this page from reaching the CLI
                            directly. Click to finish logging in in a new tab.
                        </Alert>
                        <Button
                            data-testid="cli-auth-handoff"
                            fullWidth
                            onClick={handleHandoff}
                            variant="contained"
                        >
                            Finish logging in
                        </Button>
                        <Button
                            fullWidth
                            onClick={() => setStatus("fallback")}
                            sx={{ mt: 1 }}
                            variant="text"
                        >
                            Copy the code manually instead
                        </Button>
                    </Box>
                )}

                {status === "fallback" && (
                    <Box width="100%">
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            <AlertTitle>
                                Could not reach the CLI automatically
                            </AlertTitle>
                            Copy this handoff code and paste it into the
                            terminal.
                        </Alert>
                        <Box display="flex" gap={1} width="100%">
                            <TextField
                                fullWidth
                                label="Handoff code"
                                size="small"
                                slotProps={{
                                    input: {
                                        readOnly: true,
                                    },
                                }}
                                value={handoffCode}
                                variant="outlined"
                            />
                            <Button
                                color={copied ? "success" : "primary"}
                                onClick={handleCopy}
                                startIcon={copied ? null : <ContentCopyIcon />}
                                sx={{ minWidth: "100px" }}
                                variant="contained"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
