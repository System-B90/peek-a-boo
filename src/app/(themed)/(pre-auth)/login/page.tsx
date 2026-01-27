'use client';
import { getAuthSystem } from "@/client-api/auth";
import { safeApiFetcher } from "@/client-api/common-utils";
import { AuthSystem } from "@/shared-api/types";
import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { FormEventHandler, useCallback, useMemo, useState } from "react";

export default function LoginPage()
{
    const [ username, setUsername ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ error, setError ] = useState<null | string>(null);
    const [ authSystem, setAuthSystem ] = useState<AuthSystem>();
    const handleSubmit: FormEventHandler = useCallback((event) =>
    {
        event.preventDefault();


        if (typeof document === "undefined")
        {
            return;
        }

        safeApiFetcher(`/api/login`, {
            method: 'POST',
            body: JSON.stringify({
                username,
                password,
            })
        }).then(() =>
        {
            console.log('Login success!');

            const cookieString = document.cookie;
            const cookieObject: Record<string, string> = cookieString
                .split(";")
                .reduce((acc, curr) =>
                {
                    const [ key, value ] = curr.trim().split("=");
                    return { ...acc, [ key ]: decodeURIComponent(value) };
                }, {});

            window.location.pathname = cookieObject[ 'postLoginRedirect' ] || '/';
        }).catch((error) =>
        {
            setError(error[ 'status' ]);
            setPassword('');
        });
    }, [ username, password, setError, setPassword ]);

    useMemo(() =>
    {
        getAuthSystem().then(setAuthSystem);
    }, [ setAuthSystem ]);

    return (
        <div className="flex flex-col items-center pt-20">
            <Box sx={ { width: '100%', padding: 2, margin: 'auto', maxWidth: 400 } }>
                <Grid container spacing={ 2 } direction="column" alignItems="center">
                    <Grid container={ false }>
                        <Typography variant="h4" component="h1">
                            Login
                        </Typography>
                    </Grid>
                    <Grid container={ false }>
                        <form onSubmit={ handleSubmit }>
                            <TextField
                                id="username"
                                label="Username"
                                value={ username }
                                onChange={ (event) => setUsername(event.target.value) }
                                variant="outlined"
                                fullWidth
                                margin="normal"
                            />
                            <TextField
                                id="password"
                                label="Password"
                                type="password"
                                value={ password }
                                onChange={ (event) => setPassword(event.target.value) }
                                variant="outlined"
                                fullWidth
                                margin="normal"
                            />
                            { error && (
                                <Typography color="error" variant="body2">
                                    { error }
                                </Typography>
                            ) }
                            <Button type="submit" variant="contained" fullWidth>
                                Login
                            </Button>
                        </form>
                    </Grid>
                    <Typography variant="h6" component="h6" dir="rtl">
                        השתמשו במשתמש ה-{ authSystem === 'ldap' ? 'LDAP' : 'Hive' } שלכם
                    </Typography>
                </Grid>
            </Box>
        </div>
    );
}