/* eslint-disable @typescript-eslint/no-explicit-any */

import assert from "assert";

export class ClientError extends Error
{
    status?: string;
    constructor(message?: string)
    {
        super(message);
        this.status = message;
        this.name = 'ClientError';
    }
};

export class ServerNetworkError extends ClientError
{
    constructor(message?: string)
    {
        super(message);
        this.name = 'ServerNetworkError';
    }
}

export class ClientApiError extends ClientError
{
    constructor(message?: string | ClientApiError)
    {
        super(typeof message === 'string' ? message : message?.message);
        if (typeof message === 'string')
        {
            this.name = 'ClientApiError';
        }
        else if (message)
        {
            this.name = message.name;
            if (message.status !== undefined)
            {
                this.status = message.status;
            }
        }
    }
}

export class UserNotLoggedInError extends ClientApiError
{
    constructor(message?: string)
    {
        super(message);
        this.name = 'UserNotLoggedInError';
    }
};

export class MattermostError extends ClientApiError
{
    constructor(message?: string)
    {
        super(message);
        this.name = 'MattermostError';
    }
};

export class MattermostConnectionError extends MattermostError
{
    constructor(message?: string)
    {
        super(message);
        this.name = 'MattermostConnectionError';
    }
};


export class MattermostApiError extends MattermostError
{
    constructor(message?: string)
    {
        super(message);
        this.name = 'MattermostApiError';
    }
};


export class HiveError extends ClientApiError
{
    constructor(message?: string)
    {
        super(message);
        this.name = 'HiveError';
    }
};

export class HiveConnectionError extends HiveError
{
    constructor(message?: string)
    {
        super(message);
        this.name = 'HiveConnectionError';
    }
};
export function constructErrorFromNetworkMessage(networkMessage: ClientApiError): ClientApiError
{
    return new ClientApiError(networkMessage);
}

// Define the shape of the syscall error cause
interface SyscallErrorCause
{
    code: string;
    syscall: string;
}

// Narrowed type for errors matching the syscall pattern
export function isSyscallError(error: unknown): error is
    | (Error & { cause: SyscallErrorCause; })
    | (Error & SyscallErrorCause) 
{
    if (!(error instanceof Error)) return false;
    const cause = (error as any).cause;
    return (
        typeof cause === 'object' &&
        cause !== null &&
        'code' in cause &&
        'syscall' in cause &&
        typeof (cause as any).code === 'string' &&
        typeof (cause as any).syscall === 'string'
    ) || (
            'code' in error &&
            'syscall' in error &&
            typeof (error as any).code === 'string' &&
            typeof (error as any).syscall === 'string'

        );
}

export function parseSyscallError(error: unknown): { syscall: string; code: string; }
{
    if (!isSyscallError(error))
    {
        throw new TypeError('Cannot parse non-syscall error as SyscallError!');
    }
    if ('cause' in error && error.cause)
    {
        assert(typeof error.cause === 'object');
        assert('code' in error.cause && typeof error.cause.code === 'string');
        assert('syscall' in error.cause && typeof error.cause.syscall === 'string');
        return {
            code: error.cause.code,
            syscall: error.cause.syscall,
        };
    } else
    {
        return {
            code: (error as SyscallErrorCause).code,
            syscall: (error as SyscallErrorCause).syscall,
        };
    }
}

export function isNetworkHostNotFoundError(error: unknown): error is Error & { cause: SyscallErrorCause; } & { cause: { code: 'ENOTFOUND'; syscall: 'getaddrinfo'; hostname: string; }; }
{
    if (!isSyscallError(error)) { return false; }
    const { code, syscall } = parseSyscallError(error);
    if (
        code !== 'ENOTFOUND'
        || syscall !== 'getaddrinfo') { return false; }

    const hostname = (typeof error.cause === 'object' && error.cause && 'hostname' in error.cause) ? error.cause.hostname : ('hostname' in error ? error.hostname : null);
    if (typeof hostname !== 'string') { return false; }

    return true;
}

export function parseNetworkHostNotFoundError(error: unknown)
{
    if (!isNetworkHostNotFoundError(error)) { throw error; }
    const hostname = (typeof error.cause === 'object' && error.cause && 'hostname' in error.cause) ? error.cause.hostname : ('hostname' in error ? error.hostname : null);

    return {
        ...parseSyscallError(error), hostname,
    };
}
