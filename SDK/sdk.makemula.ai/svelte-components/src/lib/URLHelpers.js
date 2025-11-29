export const createSHA256Hash = async (input) => {
    // Encode the input string as UTF-8
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    // Generate the SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert the hash to a hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return hashHex;
}
