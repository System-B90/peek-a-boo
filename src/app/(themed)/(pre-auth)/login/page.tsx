"use client";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useCallback, useEffect, useState } from "react";

import { safeApiFetcher } from "@/client-api/common-utils";
import { PeekabooIconGlyph } from "@/glyphs/peekaboo-icon";
import { getAuthenticationErrorMessage } from "@/shared-api/auth-error";

const SIGN_IN_TIMEOUT_MS = 15000;

function LoginWidget() {
    const searchParams = useSearchParams();
    const urlError = searchParams.get("error");
    const authErrorDetails =
        searchParams.get("error_description") ?? searchParams.get("message");

    const [allowLoginBypass, setAllowLoginBypass] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [clientError, setClientError] = useState<null | string>(null);

    useEffect(() => {
        safeApiFetcher("/api/env/login-bypass")
            .then((data: { ALLOW_LOGIN_BYPASS: boolean }) => {
                setAllowLoginBypass(data.ALLOW_LOGIN_BYPASS);
            })
            .catch((error: unknown) => {
                console.error("Failed to determine login bypass state:", error);
            });
    }, []);

    const authError = clientError ?? urlError;
    const authErrorMessage = getAuthenticationErrorMessage(authError);

    const handleSignIn = useCallback(() => {
        setIsSigningIn(true);
        setClientError(null);

        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(
                () => reject(new Error("Timeout")),
                SIGN_IN_TIMEOUT_MS,
            );
        });

        void Promise.race([
            signIn("hive", { callbackUrl: "/api/login" }),
            timeout,
        ])
            .catch((error: unknown) => {
                setIsSigningIn(false);
                setClientError(
                    error instanceof Error && error.message === "Timeout"
                        ? "Timeout"
                        : "NetworkError",
                );
            })
            .finally(() => clearTimeout(timer));
    }, []);

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
            <Box
                alignItems="center"
                display="flex"
                flexDirection="column"
                textAlign="center"
            >
                <Box height="6rem" width="6rem">
                    <PeekabooIconGlyph glyphTitle="Peek-a-boo" />
                </Box>
                <Typography
                    component="h1"
                    fontWeight="bold"
                    letterSpacing="-0.02em"
                    mt={1}
                    variant="h4"
                >
                    Peek-a-boo
                </Typography>
                <Typography color="text.secondary" fontSize={14}>
                    Monitor your students the smart way
                </Typography>
            </Box>

            <Box>
                {authErrorMessage ? (
                    <Alert dir="rtl" severity="error" sx={{ mb: 2 }}>
                        <AlertTitle>ההתחברות נכשלה</AlertTitle>
                        {authErrorMessage}
                        {authErrorDetails ? (
                            <Typography
                                color="text.secondary"
                                component="p"
                                fontFamily="monospace"
                                fontSize={12}
                                mt={1}
                            >
                                {authErrorDetails}
                            </Typography>
                        ) : null}
                        {authError ? (
                            <Typography
                                color="text.secondary"
                                component="p"
                                fontFamily="monospace"
                                fontSize={11}
                                mt={0.5}
                            >
                                קוד: {authError}
                            </Typography>
                        ) : null}
                    </Alert>
                ) : null}
                <Box display="flex" flexDirection="column" gap={2}>
                    <Button
                        dir="rtl"
                        disabled={isSigningIn}
                        fullWidth
                        onClick={handleSignIn}
                        size="large"
                        startIcon={
                            isSigningIn ? (
                                <CircularProgress color="inherit" size={20} />
                            ) : null
                        }
                        sx={{
                            // MUI's startIcon margins are physical (left/right)
                            // and don't flip under dir="rtl".
                            "& .MuiButton-startIcon": {
                                marginLeft: 0,
                                marginRight: 0,
                                marginInlineEnd: 1,
                                marginInlineStart: "-4px",
                            },
                        }}
                        variant="contained"
                    >
                        {isSigningIn ? "מתחברים..." : "התחברות עם הייב"}
                    </Button>
                    {allowLoginBypass ? (
                        <Button
                            component="a"
                            fullWidth
                            href="/api/login"
                            variant="outlined"
                        >
                            Continue (dev bypass)
                        </Button>
                    ) : null}
                </Box>
            </Box>
        </Box>
    );
}

export default function LoginPage() {
    return (
        <Box
            alignItems="flex-start"
            bgcolor="background.default"
            display="flex"
            height="100vh"
            justifyContent="center"
            pt="20vh"
            width="100%"
        >
            <Suspense fallback={null}>
                <LoginWidget />
            </Suspense>
        </Box>
    );
}
