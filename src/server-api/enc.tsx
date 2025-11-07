export interface JWTUserData {
    name: string;
    username: string;
    webSocketHost: string;
    vncClientPassword: string;
};

export function getJwtSecret() {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable has not been set!");
    }
    return jwtSecret;
}

let _encryptionKey: CryptoKey | null = null;
export async function getSymetricalEncyptionKey() {
    if (null === _encryptionKey) {
        const symEncKey = process.env.SYM_ENC_KEY;
        if (!symEncKey) {
            throw new Error("SYM_ENC_KEY environment variable has not been set!");
        }
        _encryptionKey = await crypto.subtle.importKey(
            'raw',
            Buffer.from(symEncKey, 'base64'),
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }
    return _encryptionKey;
}
