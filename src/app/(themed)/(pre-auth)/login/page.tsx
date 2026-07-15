"use client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEventHandler, useCallback, useMemo, useState } from "react";

import { getAuthSystem } from "@/client-api/auth";
import { safeApiFetcher } from "@/client-api/common-utils";
import { AuthSystem } from "@/shared-api/types";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<null | string>(null);
    const [authSystem, setAuthSystem] = useState<AuthSystem>();
    const handleSubmit: FormEventHandler = useCallback(
        (event) => {
            event.preventDefault();

            if (typeof document === "undefined") {
                return;
            }

            safeApiFetcher(`/api/login`, {
                method: "POST",
                body: JSON.stringify({
                    username,
                    password,
                }),
            })
                .then(() => {
                    console.log("Login success!");

                    const cookieString = document.cookie;
                    const cookieObject: Record<string, string> = cookieString
                        .split(";")
                        .reduce((acc, curr) => {
                            const [key, value] = curr.trim().split("=");
                            return { ...acc, [key]: decodeURIComponent(value) };
                        }, {});

                    window.location.pathname =
                        cookieObject["postLoginRedirect"] || "/";
                })
                .catch((error) => {
                    setError(error["status"]);
                    setPassword("");
                });
        },
        [username, password, setError, setPassword],
    );

    useMemo(() => {
        getAuthSystem()
            .then(setAuthSystem)
            .catch((error: unknown) => {
                console.error("Failed to determine auth system:", error);
            });
    }, [setAuthSystem]);

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
                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                id="username"
                                label="Username"
                                margin="normal"
                                onChange={(event) =>
                                    setUsername(event.target.value)
                                }
                                value={username}
                                variant="outlined"
                            />
                            <TextField
                                fullWidth
                                id="password"
                                label="Password"
                                margin="normal"
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                type="password"
                                value={password}
                                variant="outlined"
                            />
                            {error ? <Typography color="error" variant="body2">
                                {error}
                            </Typography> : null}
                            <Button fullWidth type="submit" variant="contained">
                                Login
                            </Button>
                        </form>
                    </Grid>
                    <Typography component="h6" dir="rtl" variant="h6">
                        השתמשו במשתמש ה-
                        {authSystem === "ldap" ? "LDAP" : "Hive"} שלכם
                    </Typography>
                </Grid>
            </Box>
        </div>
    );
}
