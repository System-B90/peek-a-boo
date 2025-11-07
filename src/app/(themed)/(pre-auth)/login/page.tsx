'use client'
import { safeApiFetcher } from "@/client-api/common-utils";
import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { FormEventHandler, useCallback, useState } from "react";

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<null | string>(null);

    const handleSubmit: FormEventHandler = useCallback((event) => {
        event.preventDefault();

        safeApiFetcher(`/api/login`, {
            method: 'POST',
            body: JSON.stringify({
                username,
                password,
            })
        }).then(() => {
            console.log('Login success!');
            window.location.pathname = '/';
        }).catch((error) => {
            setError(error['status']);
            setPassword('');
        });
    }, [username, password, setError, setPassword]);

    return (
        <div className="flex flex-col items-center pt-20">
            <Box sx={{ width: '100%', padding: 2, margin: 'auto', maxWidth: 400 }}>
                <Grid container spacing={2} direction="column" alignItems="center">
                    <Grid container={false}>
                        <Typography variant="h4" component="h1">
                            Login
                        </Typography>
                    </Grid>
                    <Grid container={false}>
                        <form onSubmit={handleSubmit}>
                            <TextField
                                id="username"
                                label="Username"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                variant="outlined"
                                fullWidth
                                margin="normal"
                            />
                            <TextField
                                id="password"
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                variant="outlined"
                                fullWidth
                                margin="normal"
                            />
                            {error && (
                                <Typography color="error" variant="body2">
                                    {error}
                                </Typography>
                            )}
                            <Button type="submit" variant="contained" fullWidth>
                                Login
                            </Button>
                        </form>
                    </Grid>
                    <Typography variant="h6" component="h6" dir="rtl">
                        השתמשו במשתמש ה-LDAP שלכם
                    </Typography>
                </Grid>
            </Box>
        </div>
    )
}