"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState, useCallback, useEffect } from "react";

import { enqueueApiErrorSnackbar } from "@/components/snackbar-utils";

// ------------------------- COMPONENT: CommandBlock -------------------------
function CommandBlock({ title, command }: { title: string; command: string }) {
    const [copyPopup, setCopyPopup] = useState(false);

    const handleCopy = useCallback(() => {
        void navigator.clipboard.writeText(command);
        setCopyPopup(true);
    }, [command]);

    return (
        <Box mt={3} position="relative">
            <Typography mb={1} variant="subtitle1">
                {title}
            </Typography>

            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    fontFamily: "Consolas, monospace",
                    whiteSpace: "pre-wrap",
                    overflowX: "auto",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    position: "relative",
                }}
            >
                <Typography
                    component="code"
                    sx={{
                        fontFamily: "Consolas, monospace",
                        fontSize: "0.9rem",
                    }}
                >
                    {command}
                </Typography>

                <IconButton
                    onClick={handleCopy}
                    size="small"
                    sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        boxShadow: 1,
                        "&:hover": { bgcolor: "#444" },
                    }}
                >
                    <ContentCopyIcon fontSize="small" />
                </IconButton>
            </Paper>

            <Snackbar
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                autoHideDuration={2000}
                onClose={() => setCopyPopup(false)}
                open={copyPopup}
            >
                <Alert severity="success" variant="filled">
                    Command copied to clipboard!
                </Alert>
            </Snackbar>
        </Box>
    );
}

// ------------------------- COMPONENT: InputField -------------------------
function InputField({
    label,
    value,
    onChange,
    type = "text",
    showPasswordToggle = false,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    showPasswordToggle?: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <TextField
            fullWidth
            InputProps={
                showPasswordToggle
                    ? {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword((v) => !v)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <VisibilityOff />
                                    ) : (
                                        <Visibility />
                                    )}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }
                    : undefined
            }
            label={label}
            onChange={(e) => onChange(e.target.value)}
            type={showPasswordToggle && showPassword ? "text" : type}
            value={value}
        />
    );
}

// ------------------------- MAIN COMPONENT -------------------------
export function VNCClientAdministrationPane() {
    const [hostname, setHostname] = useState("");
    const [protocol, setProtocol] = useState("");

    // Run only on client
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- reading window.location (a browser-only API) into state on mount */
        const port = window.location.port;
        setHostname(`${window.location.hostname}${port ? ":" + port : ""}`);
        setProtocol(window.location.protocol.replace(":", ""));
        /* eslint-enable react-hooks/set-state-in-effect */
    }, []);

    const [computerName, setComputerName] = useState("STUDENT-PC01");
    const [username, setUsername] = useState("administrator");
    const [password, setPassword] = useState("Password1");
    const [searchScope, setSearchScope] = useState(
        "OU=Classroom,DC=example,DC=com",
    );
    const [rawPowershellCommand, setRawPowershellCommand] = useState("");

    useEffect(() => {
        fetch("/api/install-client")
            .then((res) => res.json())
            .then(setRawPowershellCommand)
            .catch((error) =>
                enqueueApiErrorSnackbar(
                    "Failed to get raw PowerShell command!",
                    error,
                ),
            );
    }, []);

    const command = useMemo(() => {
        if (!hostname || !protocol) return "...";
        return `PsExec64 \\\\${computerName} -u ${username} -p ${password} -h powershell "Invoke-Expression (Invoke-RestMethod ${protocol}://${hostname}/api/install-client)"`;
    }, [computerName, username, password, hostname, protocol]);

    const bulkCommand = useMemo(() => {
        if (!hostname || !protocol) return "...";
        return `Get-ADComputer -SearchScope ${searchScope} -Filter * | ForEach-Object { PsExec64 \\\\$_ -u ${username} -p ${password} -h powershell "Invoke-Expression (Invoke-RestMethod ${protocol}://${hostname}/api/install-client)" }`;
    }, [searchScope, username, password, hostname, protocol]);

    return (
        <Box>
            <Typography mb={2} variant="h6">
                Installing Peek-a-Boo Client (TightVNC) on Students
            </Typography>

            <Stack spacing={4} width="100%">
                <Stack spacing={2} width="100%">
                    <InputField
                        label="Computer Name"
                        onChange={setComputerName}
                        value={computerName}
                    />
                    <InputField
                        label="Username"
                        onChange={setUsername}
                        value={username}
                    />
                    <InputField
                        label="Password"
                        onChange={setPassword}
                        showPasswordToggle
                        type="password"
                        value={password}
                    />
                    <CommandBlock
                        command={command}
                        title="Single Computer Command"
                    />
                </Stack>

                <Stack spacing={2} width="100%">
                    <InputField
                        label="Search Scope (AD OU)"
                        onChange={setSearchScope}
                        value={searchScope}
                    />
                    <CommandBlock
                        command={bulkCommand}
                        title="Bulk AD Command"
                    />
                </Stack>

                <Stack spacing={2} width="100%">
                    <CommandBlock
                        command={rawPowershellCommand || "..."}
                        title="Raw PowerShell Command"
                    />
                </Stack>
            </Stack>
        </Box>
    );
}
