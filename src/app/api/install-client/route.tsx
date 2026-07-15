import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getSetting } from "@/server-api/settings";

export async function GET() {
    const requestHeaders = await headers();

    const forwardedHost = requestHeaders.get("X-Forwarded-Host");
    const protocol = requestHeaders.get("X-Forwarded-Proto") || "http";

    const binaryUrl = new URL(
        `${protocol}://${forwardedHost}/bin/tightvnc-setup-64bit.msi`,
    );

    const masterPassword = await getSetting("VNC_MASTER_PASSWORD");
    const vncPassword = await getSetting("VNC_CLIENT_PASSWORD");

    const ALWAYS_SHARED = [`SET_ALWAYSSHARED=1`, `VALUE_OF_ALWAYSSHARED=1`];
    const SHOW_WALPAPER = [
        `SET_REMOVE_WALLPAPER=1`,
        `VALUE_OF_REMOVEWALLPAPER=0`,
    ];
    const HIDE_ICON = [
        `SET_RUNCONTROLINTERFACE=1`,
        `VALUE_OF_RUNCONTROLINTERFACE=0`,
    ];

    const ENFORCE_PASSWORD_FOR_SETTINGS_CONTROL = [
        `SET_USECONTROLAUTHENTICATION=1`,
        `VALUE_OF_USECONTROLAUTHENTICATION=1`,
    ];
    const REQUIRE_PASSSWORD_FOR_CONNECTIONS = [
        `SET_USEVNCAUTHENTICATION=1`,
        `VALUE_OF_USEVNCAUTHENTICATION=1`,
    ];
    const MASTER_CONTROL_PASSWORD = [
        `SET_CONTROLPASSWORD=1`,
        `VALUE_OF_CONTROLPASSWORD="${masterPassword}"`,
    ];
    const CONNECTION_PASSWORD = [
        `SET_PASSWORD=1`,
        `VALUE_OF_PASSWORD="${vncPassword}"`,
    ];

    const installationCommandLine = [
        `/quiet`,
        `/norestart`,
        `ADDLOCAL="Server"`,
    ]
        .concat(
            ALWAYS_SHARED,
            SHOW_WALPAPER,
            HIDE_ICON,
            ENFORCE_PASSWORD_FOR_SETTINGS_CONTROL,
            REQUIRE_PASSSWORD_FOR_CONNECTIONS,
            MASTER_CONTROL_PASSWORD,
            CONNECTION_PASSWORD,
        )
        .map((arg) => arg.replace(/\"/g, '`"'));

    const command = [
        // Create a temporary msi file
        `$TempFile = New-TemporaryFile ; $InstallerPath = "$($TempFile.Directory)$($TempFile.BaseName).msi" ; Move-Item -Path $TempFile.FullName -Destination $InstallerPath`,

        // Download the installer
        `Invoke-WebRequest "${binaryUrl.toString()}" -OutFile $InstallerPath`,

        // Execute installer and wait for it to finish
        `Start-Process msiexec.exe -ArgumentList "/i","$InstallerPath",${installationCommandLine.map((v) => `"${v}"`).join(",")} -Wait`,

        'Write-Host "Done installing on $(hostname)!"',
    ].join(";\n");

    return NextResponse.json(command);
}
