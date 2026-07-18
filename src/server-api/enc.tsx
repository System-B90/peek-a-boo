let _encryptionKey: CryptoKey | null = null;
export async function getSymetricalEncyptionKey() {
    if (null === _encryptionKey) {
        const symEncKey = process.env.SYM_ENC_KEY;
        if (!symEncKey) {
            throw new Error(
                "SYM_ENC_KEY environment variable has not been set!",
            );
        }
        _encryptionKey = await crypto.subtle.importKey(
            "raw",
            Buffer.from(symEncKey, "base64"),
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"],
        );
    }
    return _encryptionKey;
}
