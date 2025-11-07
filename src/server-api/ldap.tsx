/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = "force-dynamic";

import { ClientApiError } from "@/shared-api/errors";
import ldap, { SearchOptions } from "ldapjs";

// Define a whitelist of allowed username patterns
const usernameWhitelist = /^[a-zA-Z0-9\._\-\@]+$/;

// Configuration for the LDAP client
const LDAP_URL = process.env.LDAP_URL ?? "ldaps://eshel.dom";
const LDAP_SEARCH_BY = "samAccountName";
const LDAP_DC = "dc=Eshel,dc=dom";

export function groupPathParser(ldapGroupPath: string): Array<Array<string>> {
  return ldapGroupPath.split(",").map((x) => x.split("="));
}

export function isUserSegel(user: { memberOf: Array<string> }): boolean {
  const segelOuPath = process.env.SEGEL_OU_PATH?.toLowerCase();
  if (!segelOuPath) { return false; }

  return user.memberOf.reduce((totalIsAllowed, ldapGroupPath) => {
    return totalIsAllowed || ldapGroupPath.toLowerCase().endsWith(segelOuPath);

    const path = groupPathParser(ldapGroupPath);
    return (
      totalIsAllowed ||
      path.reduce((isAllowed, x) => {
        return (
          isAllowed ||
          (x[0].toLowerCase() === "ou" &&
            x[1].toLocaleLowerCase().includes("segel"))
        );
      }, false)
    );
  }, false);
}

/**
 * Asynchronously verifies a user's credentials.
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<unknown>} The user's information if the user exists and the password is correct.
 * @throws {Error} If the user does not exist or the password is incorrect.
 */
export async function verifyUser(
  username: string,
  password: string
): Promise<{
  sAMAccountName: string;
  cn: string;
  memberOf: Array<string>;
}> {
  if (!LDAP_URL) {
    throw new Error(`LDAP_URL environment variables must be configured!`);
  }

  // Validate the input
  if (!usernameWhitelist.test(username) || !username || !password) {
    throw new ClientApiError("Invalid username or password!");
  }

  try {
    const ldapClient = ldap.createClient({
      url: LDAP_URL,
      timeout: 5000,
      connectTimeout: 1000,
      reconnect: true,
      tlsOptions: {
        rejectUnauthorized: false,
      },
    });

    if (/\w+\@eshel\.dom$/gi.test(username)) {
      username = username.replace("@eshel.dom", "");
    }

    // Promise to handle the user verification
    const userVerified = new Promise<ldap.SearchEntryObject>(
      (resolve, reject) => {
        ldapClient.bind(`${username}@eshel.dom`, password, (error: unknown) => {
          if (error) {
            console.error(error);
            reject(new ClientApiError("Invalid username or password!"));
          } else {
            // Search for the user's information
            const opts: SearchOptions = {
              timeLimit: 3,
              sizeLimit: 1,
              filter: `(${LDAP_SEARCH_BY}=${username})`,
              scope: "sub",
              attributes: [
                "dn",
                "sn",
                "cn",
                "ou",
                "o",
                "dc",
                "organizationalUnitName",
                "organizationName",
                "domainComponent",
                "distinguishedName",
                "uid",
                "dc",
                "mail",
                "objectclass",
                "samAccountName",
                "memberOf",
              ],
            };

            ldapClient.search(
              LDAP_DC,
              opts,
              (
                err: any,
                res: {
                  on: (
                    arg0: string,
                    arg1: (entry: ldap.SearchEntry) => void
                  ) => void;
                }
              ) => {
                if (err) {
                  reject(
                    new ClientApiError("Failed to retrieve user information!")
                  );
                } else {
                  res.on("searchEntry", (entry) => {
                    resolve(entry.pojo);
                  });
                  res.on("end", (result) => {
                    reject(
                      new ClientApiError(
                        `Failed to retrieve user information (final stage)! ${result}`
                      )
                    );
                  });
                  res.on("error", (error) => {
                    reject(
                      new ClientApiError(
                        `Failed to retrieve user information (second stage)! ${error}`
                      )
                    );
                  });
                }
              }
            );
          }
        });
      }
    );

    const userAttributes = (await userVerified)["attributes"] as Array<{
      type: string;
      values: any;
    }>;
    const userInfo: Record<string, any> = {};
    userAttributes.forEach((x) => {
      userInfo[x.type] = ["cn", "samaccountname", "mail"].includes(
        x.type.toLowerCase()
      )
        ? x.values[0]
        : x.values;
    });

    // Unbind the client
    ldapClient.unbind((err: any) => {
      if (err) {
        console.error("Failed to unbind the client!");
      }
    });

    return userInfo as Record<string, any> & {
      cn: string;
      sAMAccountName: string;
      memberOf: Array<string>;
    };
  } catch (error: unknown) {
    console.error(error);
    throw new ClientApiError("Authentication failed!");
  }
}
