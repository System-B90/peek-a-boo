import { authenticateHiveUser } from "@/server-api/hive";
import { Clearance } from "@/server-api/hive-types";
import { isUserSegel, verifyUser as verifyUserLDAP } from "@/server-api/ldap";
import { AuthSystem } from "@/shared-api/types";

export function getAuthSystem(): AuthSystem {
    const authSystem = process.env.AUTH_SYSTEM;
    switch (authSystem) {
    case "ldap":
        return AuthSystem.LDAP;
    case "hive":
        return AuthSystem.HIVE;
    default:
        throw new Error(
            `Invalid AUTH_SYSTEM environment variable: ${authSystem}`,
        );
    }
}

export async function verifyUser(
    username: string,
    password: string,
): Promise<{
    username: string;
    displayName: string;
    isUserAllowedToPeek: boolean;
}> {
    const authSystem = getAuthSystem();
    switch (authSystem) {
    case AuthSystem.LDAP: {
        const data = await verifyUserLDAP(username, password);
        return {
            username: data.sAMAccountName,
            displayName: data.cn,
            isUserAllowedToPeek: isUserSegel(data),
        };
    }
    case AuthSystem.HIVE: {
        const data = await authenticateHiveUser(username, password);
        return {
            username: data.username,
            displayName: data.displayName,
            isUserAllowedToPeek:
                    data.clearance === Clearance.Segel ||
                    data.clearance === Clearance.Admin,
        };
    }
    }
}
