"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import
    {
        Box,
        Typography,
        TextField,
        IconButton,
        Paper,
        Stack,
        Snackbar,
        Alert,
        InputAdornment,
    } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { enqueueApiErrorSnackbar } from "@/components/snackbar-utils";

// ------------------------- COMPONENT: CommandBlock -------------------------
function CommandBlock({ title, command }: { title: string; command: string; })
{
    const [ copyPopup, setCopyPopup ] = useState(false);

    const handleCopy = useCallback(() =>
    {
        navigator.clipboard.writeText(command);
        setCopyPopup(true);
    }, [ command ]);

    return (
        <Box mt={ 3 } position="relative">
            <Typography variant="subtitle1" mb={ 1 }>
                { title }
            </Typography>

            <Paper
                elevation={ 3 }
                sx={ {
                    p: 2,
                    fontFamily: "Consolas, monospace",
                    whiteSpace: "pre-wrap",
                    overflowX: "auto",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    position: "relative",
                } }
            >
                <Typography component="code" sx={ { fontFamily: "Consolas, monospace", fontSize: "0.9rem" } }>
                    { command }
                </Typography>

                <IconButton
                    onClick={ handleCopy }
                    size="small"
                    sx={ {
                        position: "absolute",
                        top: 8,
                        right: 8,
                        boxShadow: 1,
                        "&:hover": { bgcolor: "#444" },
                    } }
                >
                    <ContentCopyIcon fontSize="small" />
                </IconButton>
            </Paper>

            <Snackbar
                open={ copyPopup }
                autoHideDuration={ 2000 }
                onClose={ () => setCopyPopup(false) }
                anchorOrigin={ { vertical: "bottom", horizontal: "right" } }
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
})
{
    const [ showPassword, setShowPassword ] = useState(false);

    return (
        <TextField
            label={ label }
            value={ value }
            type={ showPasswordToggle && showPassword ? "text" : type }
            onChange={ (e) => onChange(e.target.value) }
            fullWidth
            InputProps={
                showPasswordToggle
                    ? {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={ () => setShowPassword((v) => !v) } tabIndex={ -1 }>
                                    { showPassword ? <VisibilityOff /> : <Visibility /> }
                                </IconButton>
                            </InputAdornment>
                        ),
                    }
                    : undefined
            }
        />
    );
}

// ------------------------- MAIN COMPONENT -------------------------
export default function VNCClientAdministrationPane()
{
    const [ hostname, setHostname ] = useState("");
    const [ protocol, setProtocol ] = useState("");

    // Run only on client
    useEffect(() =>
    {
        const port = window.location.port;
        setHostname(`${window.location.hostname}${port ? ":" + port : ""}`);
        setProtocol(window.location.protocol.replace(":", ""));
    }, []);

    const [ computerName, setComputerName ] = useState("STUDENT-PC01");
    const [ username, setUsername ] = useState("administrator");
    const [ password, setPassword ] = useState("Password1");
    const [ searchScope, setSearchScope ] = useState("OU=Classroom,DC=example,DC=com");
    const [ rawPowershellCommand, setRawPowershellCommand ] = useState("");

    useEffect(() =>
    {
        fetch("/api/install-client")
            .then((res) => res.json())
            .then(setRawPowershellCommand)
            .catch((error) => enqueueApiErrorSnackbar("Failed to get raw PowerShell command!", error));
    }, []);

    const command = useMemo(() =>
    {
        if (!hostname || !protocol) return "...";
        return `PsExec64 \\\\${computerName} -u ${username} -p ${password} -h powershell "Invoke-Expression (Invoke-RestMethod ${protocol}://${hostname}/api/install-client)"`;
    }, [ computerName, username, password, hostname, protocol ]);

    const bulkCommand = useMemo(() =>
    {
        if (!hostname || !protocol) return "...";
        return `Get-ADComputer -SearchScope ${searchScope} -Filter * | ForEach-Object { PsExec64 \\\\$_ -u ${username} -p ${password} -h powershell "Invoke-Expression (Invoke-RestMethod ${protocol}://${hostname}/api/install-client)" }`;
    }, [ searchScope, username, password, hostname, protocol ]);

    return (
        <Box>
            <Typography variant="h6" mb={ 2 }>
                Installing Peek-a-Boo Client (TightVNC) on Students
            </Typography>

            <Stack spacing={ 4 } width="100%">
                <Stack spacing={ 2 } width="100%">
                    <InputField label="Computer Name" value={ computerName } onChange={ setComputerName } />
                    <InputField label="Username" value={ username } onChange={ setUsername } />
                    <InputField label="Password" value={ password } onChange={ setPassword } type="password" showPasswordToggle />
                    <CommandBlock title="Single Computer Command" command={ command } />
                </Stack>

                <Stack spacing={ 2 } width="100%">
                    <InputField label="Search Scope (AD OU)" value={ searchScope } onChange={ setSearchScope } />
                    <CommandBlock title="Bulk AD Command" command={ bulkCommand } />
                </Stack>

                <Stack spacing={ 2 } width="100%">
                    <CommandBlock title="Raw PowerShell Command" command={ rawPowershellCommand || "..." } />
                </Stack>
            </Stack>
        </Box>
    );
}
