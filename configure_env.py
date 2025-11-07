#!/bin/python3
"""
Author: Michael K. Steinberg (Bis90 v25)
Created: 08/04/2025
Name: configure_env.py
"""
import base64
import os
import random
import sys


def configure():
    ENVIRONMENT_VARIABLE_NAMES = {
        "NODE_TLS_REJECT_UNAUTHORIZED": "Force strict TLS (0 or 1)",
        "SYM_ENC_KEY": "Leave blank for auto-generation",
        "JWT_SECRET": "Leave blank for auto-generation",
        "HIVE_PASSWOWRD": "Password for Hive PostgreSQL",
        "HIVE_API_PASSWORD": "Password for Hive API",
        "VNC_CLIENT_PASSWORD": "Password for VNC on student's PCs",
        "TWEET_CHANNEL_ID": "ID of Mattermost channel to which to tweet",
        "MATTERMOST_ACCESS_TOKEN": "Personal Access Token of Mattermost account to use for tweets",
        "WEBSOCKET_PORT": "Port to use for WebSockets",
        "STUDENT_USERNAME_PREFIX": "Prefix before student number in names (e.g. bis-hanich-123)",
        "WEBSOCKET_SERVER_HOSTNAME": "Hostname of server hosting websockify",
    }

    values = {}
    for variable, description in ENVIRONMENT_VARIABLE_NAMES.items():
        value = input(f"{variable} ({description}) = ")
        if (
            variable
            in (
                "SYM_ENC_KEY",
                "JWT_SECRET",
            )
            and not value
        ):
            value = base64.b64encode(random.randbytes(32)).decode()
        if variable in ("VNC_CLIENT_PASSWORD",):
            value = base64.b64encode(value.encode()).decode()
        values[variable] = value

    env_data = "\n".join(f"{k} = '{v}'" for k, v in values.items())

    with open(os.path.join(os.path.dirname(sys.argv[0]), ".env"), "w") as f:
        f.write(env_data)

    with open(
        os.path.join(
            os.path.dirname(sys.argv[0]), "websock", "websocket_token_source.txt"
        ),
        "w",
    ) as f:
        username_prefix = values["STUDENT_USERNAME_PREFIX"]
        for student_number in range(0, 100):
            f.write(
                f"{username_prefix}{student_number}: {username_prefix}{student_number}:5900\n"
            )


if __name__ == "__main__":
    configure()
