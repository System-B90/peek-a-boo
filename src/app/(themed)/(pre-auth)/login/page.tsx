"use client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { safeApiFetcher } from "@/client-api/common-utils";

export default function LoginPage() {
    const [allowLoginBypass, setAllowLoginBypass] = useState(false);

    useEffect(() => {
        safeApiFetcher("/api/env/login-bypass")
            .then((data: { ALLOW_LOGIN_BYPASS: boolean }) => {
                setAllowLoginBypass(data.ALLOW_LOGIN_BYPASS);
            })
            .catch((error: unknown) => {
                console.error("Failed to determine login bypass state:", error);
            });
    }, [setAllowLoginBypass]);

    return (
        <div className="flex flex-col items-center pt-20">
            <Box
                sx={{
                    width: "100%",
                    padding: 2,
                    margin: "auto",
                    maxWidth: 400,
                }}
            >
                <Grid
                    alignItems="center"
                    container
                    direction="column"
                    spacing={2}
                >
                    <Grid container={false}>
                        <Typography component="h1" variant="h4">
                            Login
                        </Typography>
                    </Grid>
                    <Grid container={false}>
                        <Button
                            fullWidth
                            onClick={() =>
                                signIn("hive", { callbackUrl: "/api/login" })
                            }
                            variant="contained"
                        >
                            Sign in with Hive
                        </Button>
                    </Grid>
                    {allowLoginBypass ? (
                        <Grid container={false}>
                            <Button
                                component="a"
                                fullWidth
                                href="/api/login"
                                variant="outlined"
                            >
                                Continue (dev bypass)
                            </Button>
                        </Grid>
                    ) : null}
                    <Typography component="h6" dir="rtl" variant="h6">
                        השתמשו במשתמש ה-Hive שלכם
                    </Typography>
                </Grid>
            </Box>
        </div>
    );
}
