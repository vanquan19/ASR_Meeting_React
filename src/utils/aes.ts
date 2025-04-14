// S-box for SubBytes transformation
const SBOX: number[] = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

// Inverse S-box for InvSubBytes transformation
const INV_SBOX: number[] = [
    0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
    0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
    0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
    0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
    0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
    0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
    0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
    0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
    0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
    0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
    0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
    0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
    0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
    0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
    0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
    0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
];

// Round constants for key expansion
const RCON: number[] = [
    0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a
];

// Number of rounds based on key length
const NUM_ROUNDS: { [key: number]: number } = {
    128: 10,
    192: 12,
    256: 14
};

// AES Core Functions

// SubBytes transformation
function subBytes(state: number[]): number[] {
    for (let i = 0; i < 16; i++) {
        state[i] = SBOX[state[i]];
    }
    return state;
}

// Inverse SubBytes transformation
function invSubBytes(state: number[]): number[] {
    for (let i = 0; i < 16; i++) {
        state[i] = INV_SBOX[state[i]];
    }
    return state;
}

// ShiftRows transformation
function shiftRows(state: number[]): number[] {
    // Create a copy of the state array
    const temp = [...state];
    
    // Row 1: Shift left by 1
    state[1] = temp[5];
    state[5] = temp[9];
    state[9] = temp[13];
    state[13] = temp[1];
    
    // Row 2: Shift left by 2
    state[2] = temp[10];
    state[6] = temp[14];
    state[10] = temp[2];
    state[14] = temp[6];
    
    // Row 3: Shift left by 3
    state[3] = temp[15];
    state[7] = temp[3];
    state[11] = temp[7];
    state[15] = temp[11];
    
    return state;
}

// Inverse ShiftRows transformation
function invShiftRows(state: number[]): number[] {
    // Create a copy of the state array
    const temp = [...state];
    
    // Row 1: Shift right by 1
    state[1] = temp[13];
    state[5] = temp[1];
    state[9] = temp[5];
    state[13] = temp[9];
    
    // Row 2: Shift right by 2
    state[2] = temp[10];
    state[6] = temp[14];
    state[10] = temp[2];
    state[14] = temp[6];
    
    // Row 3: Shift right by 3
    state[3] = temp[7];
    state[7] = temp[11];
    state[11] = temp[15];
    state[15] = temp[3];
    
    return state;
}

// Galois Field multiplication for MixColumns
function gmul(a: number, b: number): number {
    let p = 0;
    let hiBitSet: number;
    
    for (let i = 0; i < 8; i++) {
        if ((b & 1) !== 0) {
            p ^= a;
        }
        
        hiBitSet = (a & 0x80);
        a <<= 1;
        
        if (hiBitSet !== 0) {
            a ^= 0x1b; // XOR with the irreducible polynomial x^8 + x^4 + x^3 + x + 1
        }
        
        b >>= 1;
    }
    
    return p & 0xff;
}

// MixColumns transformation
function mixColumns(state: number[]): number[] {
    const temp = new Array(16);
    
    for (let i = 0; i < 4; i++) {
        const col = i * 4;
        temp[col] = gmul(state[col], 2) ^ gmul(state[col + 1], 3) ^ state[col + 2] ^ state[col + 3];
        temp[col + 1] = state[col] ^ gmul(state[col + 1], 2) ^ gmul(state[col + 2], 3) ^ state[col + 3];
        temp[col + 2] = state[col] ^ state[col + 1] ^ gmul(state[col + 2], 2) ^ gmul(state[col + 3], 3);
        temp[col + 3] = gmul(state[col], 3) ^ state[col + 1] ^ state[col + 2] ^ gmul(state[col + 3], 2);
    }
    
    for (let i = 0; i < 16; i++) {
        state[i] = temp[i];
    }
    
    return state;
}

// Inverse MixColumns transformation
function invMixColumns(state: number[]): number[] {
    const temp = new Array(16);
    
    for (let i = 0; i < 4; i++) {
        const col = i * 4;
        temp[col] = gmul(state[col], 14) ^ gmul(state[col + 1], 11) ^ gmul(state[col + 2], 13) ^ gmul(state[col + 3], 9);
        temp[col + 1] = gmul(state[col], 9) ^ gmul(state[col + 1], 14) ^ gmul(state[col + 2], 11) ^ gmul(state[col + 3], 13);
        temp[col + 2] = gmul(state[col], 13) ^ gmul(state[col + 1], 9) ^ gmul(state[col + 2], 14) ^ gmul(state[col + 3], 11);
        temp[col + 3] = gmul(state[col], 11) ^ gmul(state[col + 1], 13) ^ gmul(state[col + 2], 9) ^ gmul(state[col + 3], 14);
    }
    
    for (let i = 0; i < 16; i++) {
        state[i] = temp[i];
    }
    
    return state;
}

// AddRoundKey transformation
function addRoundKey(state: number[], roundKey: number[]): number[] {
    for (let i = 0; i < 16; i++) {
        state[i] ^= roundKey[i];
    }
    return state;
}

// Key Expansion for different key sizes
function keyExpansion(key: number[], keySize: number): number[] {
    const Nk = keySize / 32; // Number of 32-bit words in the key
    const Nr = NUM_ROUNDS[keySize]; // Number of rounds
    
    const expandedKey = new Array((Nr + 1) * 16); // (Nr + 1) round keys, each 16 bytes
    
    // Copy the initial key
    for (let i = 0; i < 4 * Nk; i++) {
        expandedKey[i] = key[i];
    }
    
    // Generate the rest of the expanded key
    for (let i = Nk; i < 4 * (Nr + 1); i++) {
        const temp = new Array(4);
        
        for (let j = 0; j < 4; j++) {
            temp[j] = expandedKey[(i - 1) * 4 + j];
        }
        
        if (i % Nk === 0) {
            // Rotate word
            const tempByte = temp[0];
            temp[0] = temp[1];
            temp[1] = temp[2];
            temp[2] = temp[3];
            temp[3] = tempByte;
            
            // SubWord
            for (let j = 0; j < 4; j++) {
                temp[j] = SBOX[temp[j]];
            }
            
            // XOR with round constant
            temp[0] ^= RCON[(i / Nk) - 1];
        } else if (Nk > 6 && i % Nk === 4) {
            // Additional SubWord for AES-256
            for (let j = 0; j < 4; j++) {
                temp[j] = SBOX[temp[j]];
            }
        }
        
        // XOR with word Nk positions earlier
        for (let j = 0; j < 4; j++) {
            expandedKey[i * 4 + j] = expandedKey[(i - Nk) * 4 + j] ^ temp[j];
        }
    }
    
    return expandedKey;
}

// AES Encryption
function aesEncrypt(plaintext: number[], key: number[], keySize: number): number[] {
    const Nr = NUM_ROUNDS[keySize]; // Number of rounds
    
    // Expand the key
    const expandedKey = keyExpansion(key, keySize);
    
    // Initialize state with plaintext
    const state = new Array(16);
    for (let i = 0; i < 16; i++) {
        state[i] = plaintext[i];
    }
    
    // Initial round
    addRoundKey(state, expandedKey.slice(0, 16));
    
    // Main rounds
    for (let round = 1; round < Nr; round++) {
        subBytes(state);
        shiftRows(state);
        mixColumns(state);
        addRoundKey(state, expandedKey.slice(round * 16, (round + 1) * 16));
    }
    
    // Final round (no MixColumns)
    subBytes(state);
    shiftRows(state);
    addRoundKey(state, expandedKey.slice(Nr * 16, (Nr + 1) * 16));
    
    return state;
}

// AES Decryption
function aesDecrypt(ciphertext: number[], key: number[], keySize: number): number[] {
    const Nr = NUM_ROUNDS[keySize]; // Number of rounds
    
    // Expand the key
    const expandedKey = keyExpansion(key, keySize);
    
    // Initialize state with ciphertext
    const state = new Array(16);
    for (let i = 0; i < 16; i++) {
        state[i] = ciphertext[i];
    }
    
    // Initial round
    addRoundKey(state, expandedKey.slice(Nr * 16, (Nr + 1) * 16));
    
    // Main rounds
    for (let round = Nr - 1; round > 0; round--) {
        invShiftRows(state);
        invSubBytes(state);
        addRoundKey(state, expandedKey.slice(round * 16, (round + 1) * 16));
        invMixColumns(state);
    }
    
    // Final round
    invShiftRows(state);
    invSubBytes(state);
    addRoundKey(state, expandedKey.slice(0, 16));
    
    return state;
}

// Helper Functions

// Convert string to byte array (UTF-8 encoding)
function stringToBytes(str: string): number[] {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(str));
}

// Convert byte array to string (UTF-8 decoding)
function bytesToString(bytes: number[]): string {
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes));
}

// Convert hex string to byte array
function hexToBytes(hex: string): number[] {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
}

// Convert byte array to hex string
function bytesToHex(bytes: number[]): string {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Pad the input to a multiple of 16 bytes (PKCS#7 padding)
function padInput(input: number[]): number[] {
    const blockSize = 16;
    const padLength = blockSize - (input.length % blockSize);
    const padded = new Array(input.length + padLength);
    
    for (let i = 0; i < input.length; i++) {
        padded[i] = input[i];
    }
    
    for (let i = input.length; i < padded.length; i++) {
        padded[i] = padLength;
    }
    
    return padded;
}

// Remove padding from the output
function removePadding(output: number[]): number[] {
    const padLength = output[output.length - 1];
    
    // Check if padding is valid
    if (padLength > 16) {
        return output; // Invalid padding, return as is
    }
    
    for (let i = output.length - padLength; i < output.length; i++) {
        if (output[i] !== padLength) {
            return output; // Invalid padding, return as is
        }
    }
    
    return output.slice(0, output.length - padLength);
}

// Prepare key based on key size
function prepareKey(key: string | number[], keySize: number): number[] {
    const keyBytes = typeof key === 'string' ? stringToBytes(key) : key;
    const keyLengthBytes = keySize / 8;
    
    if (keyBytes.length < keyLengthBytes) {
        // Pad key if too short
        const paddedKey = new Array(keyLengthBytes);
        for (let i = 0; i < keyLengthBytes; i++) {
            paddedKey[i] = i < keyBytes.length ? keyBytes[i] : 0;
        }
        return paddedKey;
    } else if (keyBytes.length > keyLengthBytes) {
        // Truncate key if too long
        return keyBytes.slice(0, keyLengthBytes);
    }
    
    return keyBytes;
}

// Text Encryption and Decryption Functions

/**
 * Encrypts text using AES
 * @param plaintext The text to encrypt
 * @param key The encryption key (string or byte array)
 * @param keySize The key size in bits (128, 192, or 256)
 * @returns Hex string representation of the encrypted data
 */
function encryptText(plaintext: string, key: string | number[], keySize: number = 128): string {
    // Convert text to bytes
    const plaintextBytes = stringToBytes(plaintext);
    
    // Pad the plaintext
    const paddedData = padInput(plaintextBytes);
    
    // Prepare key
    const keyBytes = prepareKey(key, keySize);
    
    // Encrypt each 16-byte block
    const encryptedData: number[] = [];
    for (let i = 0; i < paddedData.length; i += 16) {
        const block = paddedData.slice(i, i + 16);
        const encryptedBlock = aesEncrypt(block, keyBytes, keySize);
        encryptedData.push(...encryptedBlock);
    }
    
    // Return as hex string
    return bytesToHex(encryptedData);
}

/**
 * Decrypts text using AES
 * @param ciphertextHex Hex string representation of the encrypted data
 * @param key The decryption key (string or byte array)
 * @param keySize The key size in bits (128, 192, or 256)
 * @returns The decrypted text
 */
function decryptText(ciphertextHex: string, key: string | number[], keySize: number = 128): string {
    try {
        // Convert hex to bytes
        const ciphertextBytes = hexToBytes(ciphertextHex);
        
        // Prepare key
        const keyBytes = prepareKey(key, keySize);
        
        // Decrypt each 16-byte block
        const decryptedData: number[] = [];
        for (let i = 0; i < ciphertextBytes.length; i += 16) {
            const block = ciphertextBytes.slice(i, i + 16);
            const decryptedBlock = aesDecrypt(block, keyBytes, keySize);
            decryptedData.push(...decryptedBlock);
        }
        
        // Remove padding and convert to string
        const unpadded = removePadding(decryptedData);
        return bytesToString(unpadded);
    } catch (e) {
        console.error("Decryption error:", e);
        throw new Error("Decryption failed. Please check your key and ciphertext.");
    }
}

// File Encryption and Decryption Functions

interface ProcessedFile {
    name: string;
    data:  ArrayBuffer;
}

/**
 * Encrypts a file
 * @param file The file to encrypt
 * @param key The encryption key (string or byte array)
 * @param keySize The key size in bits (128, 192, or 256)
 * @returns Promise resolving to the encrypted file data
 */
async function encryptFile(file: File, key: string | number[], keySize: number = 128): Promise<ProcessedFile> {
    // Read file as array buffer
    const fileData = await readFileAsArrayBuffer(file);
    const fileBytes = new Uint8Array(fileData);
    
    // Prepare key
    const keyBytes = prepareKey(key, keySize);
    
    // Pad the file data
    const paddedData = padInput(Array.from(fileBytes));
    
    // Encrypt each 16-byte block
    const encryptedData: number[] = [];
    for (let i = 0; i < paddedData.length; i += 16) {
        const block = paddedData.slice(i, i + 16);
        const encryptedBlock = aesEncrypt(block, keyBytes, keySize);
        encryptedData.push(...encryptedBlock);
    }

    
    return {
        name: file.name + ".encrypted",
        data: new Uint8Array(encryptedData).buffer
    };
}
// function bufferToBase64(buffer: Uint8Array): string {
//     let binary = '';
//     for (let i = 0; i < buffer.length; i++) {
//         binary += String.fromCharCode(buffer[i]);
//     }
//     return btoa(binary);
// }
/**
 * Decrypts a file
 * @param file The file to decrypt
 * @param key The decryption key (string or byte array)
 * @param keySize The key size in bits (128, 192, or 256)
 * @returns Promise resolving to the decrypted file data
 */
async function decryptFile(file: File, key: string | number[], keySize: number = 128): Promise<ProcessedFile> {
    try {
        // Read file as array buffer
        const fileData = await readFileAsArrayBuffer(file);
        const fileBytes = new Uint8Array(fileData);
        
        // Prepare key
        const keyBytes = prepareKey(key, keySize);
        
        // Decrypt each 16-byte block
        const decryptedData: number[] = [];
        for (let i = 0; i < fileBytes.length; i += 16) {
            const block = Array.from(fileBytes.slice(i, i + 16));
            const decryptedBlock = aesDecrypt(block, keyBytes, keySize);
            decryptedData.push(...decryptedBlock);
        }
        
        // Remove padding
        const unpadded = removePadding(decryptedData);
        
        // Remove .encrypted extension if present
        let fileName = file.name;
        if (fileName.endsWith(".encrypted")) {
            fileName = fileName.slice(0, -10);
        } else {
            fileName = "decrypted_" + fileName;
        }
        
        return {
            name: fileName,
            data: new Uint8Array(unpadded).buffer
        };
    } catch (e) {
        console.error("Decryption error:", e);
        throw new Error("Decryption failed. Please check your key and file.");
    }
}

// Helper function to read file as ArrayBuffer
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

// Export the main functions for external use
export {
    encryptText,
    decryptText,
    encryptFile,
    decryptFile,
    stringToBytes,
    bytesToString,
    hexToBytes,
    bytesToHex
};