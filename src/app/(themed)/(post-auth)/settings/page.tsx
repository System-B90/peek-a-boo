"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
    IconButton,
    InputAdornment,
    Divider,
    Collapse,
} from "@mui/material";

import { Visibility, VisibilityOff, RestartAlt, ExpandMore, ExpandLess } from "@mui/icons-material";
import { safeApiFetcher } from "@/client-api/common-utils";
import { enqueueApiErrorSnackbar } from "@/components/snackbar-utils";
import { enqueueSnackbar } from "notistack";
import { UserControlledSettings } from "@/server-api/settings";

function Section({ title, children }: {
    title: string;
    children: React.ReactNode;
})
{
    const [ expanded, setExpanded ] = useState<boolean>(true);
    const toggleSection = useCallback(() => setExpanded(v => !v), []);

    return (
        <Box>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                onClick={ toggleSection }
                sx={ { cursor: "pointer" } }
            >
                <Typography variant="subtitle1" fontWeight={ 600 }>
                    { title }
                </Typography>
                <IconButton size="small">
                    { expanded ? <ExpandLess /> : <ExpandMore /> }
                </IconButton>
            </Stack>
            <Collapse in={ expanded }>
                <Stack spacing={ 2 } mt={ 1 }>
                    { children }
                </Stack>
            </Collapse>
            <Divider sx={ { mt: 2, mb: 2 } } />
        </Box>
    );
}


function PasswordField({ label, handleChange, value }: {
    label: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value: string;
})
{
    const [ censored, setCensored ] = useState<boolean>(true);

    return (
        <TextField
            label={ label }
            fullWidth
            type={ censored ? "password" : "text" }
            value={ value }
            onChange={ handleChange }
            InputProps={ {
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton onClick={ () => setCensored(v => !v) }>
                            { censored ? <Visibility /> : <VisibilityOff /> }
                        </IconButton>
                    </InputAdornment>
                ),
            } }
        />
    );
}

export default function SettingsPage()
{
    const [ values, setValues ] = useState<UserControlledSettings | null>(null);
    const [ saving, setSaving ] = useState(false);

    const defaultSettings = useMemo(() => safeApiFetcher("/api/settings/default") as Promise<UserControlledSettings>, []);

    useEffect(() =>
    {
        safeApiFetcher("/api/settings")
            .then(setValues)
            .catch((error) => enqueueApiErrorSnackbar("Failed to fetch settings!", error));
    }, []);

    const handleChange = useCallback(
        (key: keyof UserControlledSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
        {
            if (!values) return;
            setValues({ ...values, [ key ]: e.target.value });
        },
        [ values ]
    );

    const handleSave = useCallback(async () =>
    {
        if (!values) return;
        setSaving(true);
        safeApiFetcher("/api/settings", { method: "POST", body: JSON.stringify(values) })
            .then(() =>
            {
                setSaving(false);
                enqueueSnackbar("Settings saved!", { variant: "success" });
            })
            .catch((error) =>
            {
                setSaving(false);
                enqueueApiErrorSnackbar("Failed to save settings!", error);
            });
    }, [ values ]);

    const handleReset = useCallback(() =>
    {
        defaultSettings.then((defaults) => setValues({ ...defaults }));
    }, [ defaultSettings ]);

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

    return (
        <div className="w-full h-full flex justify-center p-8">
            <Paper className="w-full max-w-2xl p-6" elevation={ 3 }>
                <Typography variant="h5" className="mb-4 font-bold">
                    Peek-a-Boo Settings
                </Typography>

                <Box sx={ { height: '1.5rem' } } />

                <FormGroup>
                    <Stack spacing={ 3 }>

                        {/* VNC */ }
                        <Section title="VNC Settings">
                            <PasswordField label="VNC Client Password" handleChange={ handleChange("VNC_CLIENT_PASSWORD") } value={ values[ "VNC_CLIENT_PASSWORD" ] } />
                        </Section>

                        {/* Hive */ }
                        <Section title="Hive Settings">
                            <TextField
                                label="Hive Hostname"
                                fullWidth
                                value={ values.HIVE_HOSTNAME }
                                onChange={ handleChange("HIVE_HOSTNAME") }
                            />
                            <PasswordField label="Hive Password" handleChange={ handleChange("HIVE_PASSWORD") } value={ values[ "HIVE_PASSWORD" ] } />
                            <TextField
                                label="Hive API Username"
                                fullWidth
                                value={ values.HIVE_API_USERNAME }
                                onChange={ handleChange("HIVE_API_USERNAME") }
                            />
                            <PasswordField label="Hive API Password" handleChange={ handleChange("HIVE_API_PASSWORD") } value={ values[ "HIVE_API_PASSWORD" ] } />
                            <TextField
                                label="Hive Postgres Username"
                                fullWidth
                                value={ values.HIVE_POSTGRES_USERNAME }
                                onChange={ handleChange("HIVE_POSTGRES_USERNAME") }
                            />
                        </Section>

                        {/* Mattermost */ }
                        <Section title="Mattermost Settings">
                            <TextField
                                label="Mattermost URL"
                                fullWidth
                                value={ values.MATTERMOST_URL }
                                onChange={ handleChange("MATTERMOST_URL") }
                            />
                            <PasswordField label="Mattermost Access Token" handleChange={ handleChange("MATTERMOST_ACCESS_TOKEN") } value={ values[ "MATTERMOST_ACCESS_TOKEN" ] } />
                            <TextField
                                label="Tweet Channel ID"
                                fullWidth
                                value={ values.TWEET_CHANNEL_ID }
                                onChange={ handleChange("TWEET_CHANNEL_ID") }
                            />
                        </Section>


                        {/* Actions */ }
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
