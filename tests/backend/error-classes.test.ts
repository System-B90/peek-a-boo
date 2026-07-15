import { describe, expect, it } from "vitest";

import {
    ClientApiError,
    ClientError,
    HiveConnectionError,
    UserNotLoggedInError,
    constructErrorFromNetworkMessage,
} from "@/shared-api/errors";

describe("ClientError", () => {
    it("uses the message as both the error message and status", () => {
        const error = new ClientError("something broke");
        expect(error.message).toBe("something broke");
        expect(error.status).toBe("something broke");
        expect(error.name).toBe("ClientError");
    });
});

describe("ClientApiError", () => {
    it("carries a plain string message with the default name", () => {
        const error = new ClientApiError("bad request");
        expect(error.message).toBe("bad request");
        expect(error.name).toBe("ClientApiError");
    });

    it("copies name and status when constructed from another ClientApiError", () => {
        const source = new UserNotLoggedInError("please log in");
        const wrapped = new ClientApiError(source);

        expect(wrapped.name).toBe("UserNotLoggedInError");
        expect(wrapped.message).toBe("please log in");
        expect(wrapped.status).toBe(source.status);
    });
});

describe("constructErrorFromNetworkMessage", () => {
    it("wraps a network-provided error payload into a ClientApiError", () => {
        const networkError = new UserNotLoggedInError("session expired");
        const result = constructErrorFromNetworkMessage(networkError);

        expect(result).toBeInstanceOf(ClientApiError);
        expect(result.name).toBe("UserNotLoggedInError");
        expect(result.message).toBe("session expired");
    });
});

describe("error hierarchy", () => {
    it("keeps subclasses assignable to their parent error types", () => {
        const error = new HiveConnectionError("DNS failure");
        expect(error).toBeInstanceOf(ClientApiError);
        expect(error).toBeInstanceOf(ClientError);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("HiveConnectionError");
    });
});
