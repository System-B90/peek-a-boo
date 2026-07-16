/*
 * Shared error hierarchy — canonical definitions live in @system-b15/hive-core.
 * Mattermost-specific subclasses remain here as peek-a-boo–only concerns.
 */
export {
    ClientError,
    ClientApiError,
    ServerNetworkError,
    UserNotLoggedInError,
    HiveError,
    HiveConnectionError,
    constructErrorFromNetworkMessage,
    parseNetworkHostNotFoundError,
    parseNetworkConnectionResetError,
    parseNetworkTimeoutError,
} from "@system-b15/hive-core";

import { ClientApiError } from "@system-b15/hive-core";

export class MattermostError extends ClientApiError {
    constructor(message?: string) {
        super(message);
        this.name = "MattermostError";
    }
}

export class MattermostConnectionError extends MattermostError {
    constructor(message?: string) {
        super(message);
        this.name = "MattermostConnectionError";
    }
}

export class MattermostApiError extends MattermostError {
    constructor(message?: string) {
        super(message);
        this.name = "MattermostApiError";
    }
}
