"use client";

import { useCallback, useEffect, useState } from "react";
import
{
    FormGroup,
    TextField,
    Paper,
    Button,
    Typography,
    Stack,
    Box,
    CircularProgress,
    Alert,
    IconButton,
    InputAdornment
} from "@mui/material";

import { Visibility, VisibilityOff, RestartAlt } from "@mui/icons-material";
import { safeApiFetcher } from "@/client-api/common-utils";
import { enqueueApiErrorSnackbar } from "@/components/snackbar-utils";
import { enqueueSnackbar } from "notistack";

type Settings = {
    VNC_CLIENT_PASSWORD: string;
    HIVE_HOSTNAME: string;
    HIVE_PASSWORD: string;
    HIVE_API_PASSWORD: string;
    MATTERMOST_URL: string;
    MATTERMOST_ACCESS_TOKEN: string;
    TWEET_CHANNEL_ID: string;
};

// If the server returns nothing, these are the defaults
const DEFAULT_SETTINGS: Settings = {
    VNC_CLIENT_PASSWORD: atob(process.env.VNC_CLIENT_PASSWORD ?? ""),
    HIVE_HOSTNAME: process.env.HIVE_HOSTNAME ?? 'hive.org',
    HIVE_PASSWORD: process.env.HIVE_PASSWORD ?? '',
    HIVE_API_PASSWORD: process.env.HIVE_API_PASSWORD ?? '',
    MATTERMOST_URL: process.env.MATTERMOST_URL ?? 'https://mattermost',
    MATTERMOST_ACCESS_TOKEN: process.env.MATTERMOST_ACCESS_TOKEN ?? '',
    TWEET_CHANNEL_ID: process.env.TWEET_CHANNEL_ID ?? '',
};

export default function SettingsPage()
{
    const [ values, setValues ] = useState<Settings | null>(null);
    const [ initialValues, setInitialValues ] = useState<Settings>(DEFAULT_SETTINGS);
    const [ saving, setSaving ] = useState(false);

    // Track which password fields are visible
    const [ visibility, setVisibility ] = useState({
        VNC_CLIENT_PASSWORD: false,
        HIVE_PASSWORD: false,
        HIVE_API_PASSWORD: false,
        MATTERMOST_ACCESS_TOKEN: false,
    });

    const toggleVisibility = useCallback((key: keyof typeof visibility) =>
    {
        setVisibility((prev) => ({ ...prev, [ key ]: !prev[ key ] }));
    }, [ setVisibility ]);

    useEffect(() =>
    {
        safeApiFetcher('/api/settings')
            .then(setValues)
            .catch((error) => enqueueApiErrorSnackbar('Failed to fetch settings!', error));
    }, [ setValues ]);

    const handleChange = useCallback(
        (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
        {
            if (!values) return;
            setValues({ ...values, [ key ]: e.target.value });
        }, [ values, setValues ]);

    const handleSave = useCallback(async () =>
    {
        if (!values) return;

        setSaving(true);

        safeApiFetcher('/api/settings', { method: 'POST', body: JSON.stringify(values) })
            .then(() =>
            {
                setInitialValues(values); // update baseline for "reset"
                setSaving(false);
                enqueueSnackbar('Settings saved!', { variant: 'success' });
            })
            .catch((error) =>
            {
                setSaving(false);
                enqueueApiErrorSnackbar('Failed to save settings!', error);
            });
    }, [ values, setInitialValues, setSaving ]);

    const handleReset = useCallback(() =>
    {
        setValues({ ...initialValues });
    }, [ setValues ]);

    if (!values)
    {
        return (
            <div className="w-full h-full flex justify-center p-8">
                <Paper className="w-full max-w-2xl p-6 flex justify-center" elevation={ 3 }>
                    <CircularProgress />
                </Paper>
            </div>
        );
    }

    // Utility: wrap password text fields with icon button
    const PasswordField = (
        key: keyof Settings,
        label: string,
        visibilityKey: keyof typeof visibility
    ) => (
        <TextField
            label={ label }
            fullWidth
            type={ visibility[ visibilityKey ] ? "text" : "password" }
            value={ (values as Settings)[ key ] }
            onChange={ handleChange(key) }
            InputProps={ {
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton onClick={ () => toggleVisibility(visibilityKey) }>
                            { visibility[ visibilityKey ] ? <VisibilityOff /> : <Visibility /> }
                        </IconButton>
                    </InputAdornment>
                ),
            } }
        />
    );

    return (
        <div className="w-full h-full flex justify-center p-8">
            <Paper className="w-full max-w-2xl p-6" elevation={ 3 }>
                <Typography variant="h5" className="mb-4 font-bold">
                    Peek-a-Boo Settings
                </Typography>

                <Box sx={ { height: "1rem" } } />

                <FormGroup>
                    <Stack spacing={ 3 }>

                        {/* Non-password */ }
                        <TextField
                            label="VNC Client Password"
                            fullWidth
                            type={ visibility.VNC_CLIENT_PASSWORD ? "text" : "password" }
                            value={ values.VNC_CLIENT_PASSWORD }
                            onChange={ handleChange("VNC_CLIENT_PASSWORD") }
                            InputProps={ {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={ () =>
                                                toggleVisibility("VNC_CLIENT_PASSWORD")
                                            }
                                        >
                                            { visibility.VNC_CLIENT_PASSWORD ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            ) }
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            } }
                        />

                        <TextField
                            label="Hive Hostname"
                            fullWidth
                            value={ values.HIVE_HOSTNAME }
                            onChange={ handleChange("HIVE_HOSTNAME") }
                        />

                        { PasswordField("HIVE_PASSWORD", "Hive Password", "HIVE_PASSWORD") }
                        { PasswordField("HIVE_API_PASSWORD", "Hive API Password", "HIVE_API_PASSWORD") }
                        <TextField
                            label="Mattermost URL"
                            fullWidth
                            value={ values.MATTERMOST_URL }
                            onChange={ handleChange("MATTERMOST_URL") }
                        />

                        { PasswordField(
                            "MATTERMOST_ACCESS_TOKEN",
                            "Mattermost Access Token",
                            "MATTERMOST_ACCESS_TOKEN"
                        ) }

                        <TextField
                            label="Tweet Channel ID"
                            fullWidth
                            value={ values.TWEET_CHANNEL_ID }
                            onChange={ handleChange("TWEET_CHANNEL_ID") }
                        />

                        <Stack direction="row" spacing={ 2 } sx={ { mt: 1 } }>
                            <Button
                                variant="contained"
                                size="large"
                                disabled={ saving }
                                onClick={ handleSave }
                            >
                                { saving ? <CircularProgress size={ 20 } /> : "Save Settings" }
                            </Button>

                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={ <RestartAlt /> }
                                onClick={ handleReset }
                                disabled={ saving }
                            >
                                Reset to Defaults
                            </Button>
                        </Stack>
                    </Stack>
                </FormGroup>
            </Paper>
        </div>
    );
}
