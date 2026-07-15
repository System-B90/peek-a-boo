"use client";

import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import RestartAlt from "@mui/icons-material/RestartAlt";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { enqueueSnackbar } from "notistack";
import {
    InputHTMLAttributes,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { safeApiFetcher } from "@/client-api/common-utils";
import { enqueueApiErrorSnackbar } from "@/components/snackbar-utils";
import { UserControlledSettings } from "@/server-api/settings";

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    const [expanded, setExpanded] = useState<boolean>(true);
    const toggleSection = useCallback(() => setExpanded((v) => !v), []);

    return (
        <Box>
            <Stack
                alignItems="center"
                direction="row"
                justifyContent="space-between"
                onClick={toggleSection}
                sx={{ cursor: "pointer" }}
            >
                <Typography fontWeight={600} variant="subtitle1">
                    {title}
                </Typography>
                <IconButton size="small">
                    {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
            </Stack>
            <Collapse in={expanded}>
                <Stack mt={1} spacing={2}>
                    {children}
                </Stack>
            </Collapse>
            <Divider sx={{ mt: 2, mb: 2 }} />
        </Box>
    );
}

function PasswordField({
    label,
    handleChange,
    value,
    ...props
}: {
    label: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value: string;
} & InputHTMLAttributes<HTMLInputElement>) {
    const [censored, setCensored] = useState<boolean>(true);

    return (
        <TextField
            fullWidth
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton onClick={() => setCensored((v) => !v)}>
                            {censored ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                    </InputAdornment>
                ),
            }}
            label={label}
            onChange={handleChange}
            slotProps={{ htmlInput: { ...props } }}
            type={censored ? "password" : "text"}
            value={value}
        />
    );
}

export function SettingsForm() {
    const [values, setValues] = useState<null | UserControlledSettings>(null);
    const [saving, setSaving] = useState(false);

    const defaultSettings = useMemo(
        () =>
            safeApiFetcher(
                "/api/settings/default",
            ) as Promise<UserControlledSettings>,
        [],
    );

    useEffect(() => {
        safeApiFetcher("/api/settings")
            .then(setValues)
            .catch((error) =>
                enqueueApiErrorSnackbar("Failed to fetch settings!", error),
            );
    }, []);

    const handleChange = useCallback(
        (key: keyof UserControlledSettings) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                if (!values) return;
                setValues({ ...values, [key]: e.target.value });
            },
        [values],
    );

    const handleSave = useCallback(async () => {
        if (!values) return;
        setSaving(true);
        safeApiFetcher("/api/settings", {
            method: "POST",
            body: JSON.stringify(values),
        })
            .then(() => {
                setSaving(false);
                enqueueSnackbar("Settings saved!", { variant: "success" });
            })
            .catch((error) => {
                setSaving(false);
                enqueueApiErrorSnackbar("Failed to save settings!", error);
            });
    }, [values]);

    const handleReset = useCallback(() => {
        defaultSettings
            .then((defaults) => setValues({ ...defaults }))
            .catch((error: unknown) => {
                enqueueApiErrorSnackbar("Failed to load default settings!", error);
            });
    }, [defaultSettings]);

    if (!values) {
        return (
            <div className="w-full h-full flex justify-center p-8">
                <Paper
                    className="w-full max-w-2xl p-6 flex justify-center"
                    elevation={3}
                >
                    <CircularProgress />
                </Paper>
            </div>
        );
    }

    return (
        <FormGroup>
            <Stack spacing={3}>
                {/* VNC */}
                <Section title="VNC Settings">
                    <PasswordField
                        handleChange={handleChange("VNC_MASTER_PASSWORD")}
                        label="VNC Master Password"
                        maxLength={6}
                        value={values["VNC_MASTER_PASSWORD"]}
                    />
                    <PasswordField
                        handleChange={handleChange("VNC_CLIENT_PASSWORD")}
                        label="VNC Client Password"
                        maxLength={6}
                        value={values["VNC_CLIENT_PASSWORD"]}
                    />
                </Section>

                {/* Hive */}
                <Section title="Hive Settings">
                    <TextField
                        fullWidth
                        label="Hive Hostname"
                        onChange={handleChange("HIVE_HOSTNAME")}
                        value={values.HIVE_HOSTNAME}
                    />
                    <PasswordField
                        handleChange={handleChange("HIVE_PASSWORD")}
                        label="Hive Password"
                        value={values["HIVE_PASSWORD"]}
                    />
                    <TextField
                        fullWidth
                        label="Hive API Username"
                        onChange={handleChange("HIVE_API_USERNAME")}
                        value={values.HIVE_API_USERNAME}
                    />
                    <PasswordField
                        handleChange={handleChange("HIVE_API_PASSWORD")}
                        label="Hive API Password"
                        value={values["HIVE_API_PASSWORD"]}
                    />
                    <TextField
                        fullWidth
                        label="Hive Postgres Username"
                        onChange={handleChange("HIVE_POSTGRES_USERNAME")}
                        value={values.HIVE_POSTGRES_USERNAME}
                    />
                </Section>

                {/* Mattermost */}
                <Section title="Mattermost Settings">
                    <TextField
                        fullWidth
                        label="Mattermost URL"
                        onChange={handleChange("MATTERMOST_URL")}
                        value={values.MATTERMOST_URL}
                    />
                    <PasswordField
                        handleChange={handleChange("MATTERMOST_ACCESS_TOKEN")}
                        label="Mattermost Access Token"
                        value={values["MATTERMOST_ACCESS_TOKEN"]}
                    />
                    <TextField
                        fullWidth
                        label="Tweet Channel ID"
                        onChange={handleChange("TWEET_CHANNEL_ID")}
                        value={values.TWEET_CHANNEL_ID}
                    />
                </Section>

                {/* Actions */}
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Button
                        disabled={saving}
                        onClick={handleSave}
                        size="large"
                        variant="contained"
                    >
                        {saving ? (
                            <CircularProgress size={20} />
                        ) : (
                            "Save Settings"
                        )}
                    </Button>

                    <Button
                        color="primary"
                        disabled={saving}
                        onClick={handleReset}
                        startIcon={<RestartAlt />}
                        variant="outlined"
                    >
                        Reset to Defaults
                    </Button>
                </Stack>
            </Stack>
        </FormGroup>
    );
}
