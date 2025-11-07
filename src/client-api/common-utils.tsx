/* eslint-disable @typescript-eslint/no-explicit-any */
import { constructErrorFromNetworkMessage, ClientApiError, UserNotLoggedInError, ClientError, ServerNetworkError } from "@/shared-api/errors";
import { ApiResponseJson } from "@/shared-api/types";

const API_LOGIN_REQUIRED_SLEEP_TIMEOUT = 60 * 1000; // 1 Minute

export function safeFetcher(input: RequestInfo, init?: RequestInit | undefined): Promise<Response> {
    return fetch(input, init);
}

export function safeApiFetcher(input: RequestInfo, init?: RequestInit | undefined, withCatch?: boolean): Promise<any | false> {
    return safeFetcher(input, init)
        .then((response) => {
            // An API request should only return a redirect if the user is not logged in!
            if (response.redirected) {
                window.location.replace(response.url);
                return new Promise((r) => setTimeout(r, API_LOGIN_REQUIRED_SLEEP_TIMEOUT));
            }

            return response.json()
                .then((data: ApiResponseJson) => {
                    if (data.status === 0) {
                        return data.data;
                    }

                    throw constructErrorFromNetworkMessage(data.error as ClientApiError);
                })
                .catch((e: unknown | ClientApiError) => {
                    if (withCatch !== true) { throw e; }

                    if (e instanceof UserNotLoggedInError) {
                        console.error(`[UserNotLoggedInError] ${e.status}`);
                    }
                    else if (e instanceof ClientApiError) {
                        console.error(`[ClientApiError] ${e.status}`);
                    }
                    else if (e instanceof ClientError) {
                        console.error(`[ClientError] ${e}`);
                    }
                    else {
                        console.error(`Api json error: ${e}`);
                    }
                    return false;
                });
        })
        .catch((e: unknown) => {
            if (e instanceof ClientApiError) { throw e; }
            throw new ServerNetworkError(JSON.stringify(e));
        });
}
