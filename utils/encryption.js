import crypto from "crypto";

// Pull the encryption key from env - it absolutely has to be 32 bytes (64 hex characters)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; 
const ALGORITHM = "aes-256-gcm";

export const encryptData = (text) => {
  // Initialization vector - 16 bytes for GCM!
  const iv = crypto.randomBytes(16); 
  
  // setting up the cipher block using the algorithm, the buffer key, and our random iv
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // GCM provides an auth tag to ensure the ciphertext hasn't been tampered with
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    iv: iv.toString("hex"),
    encrypted,
    authTag
  };
};

export const decryptData = (encryptedData, ivHex, authTagHex) => {
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY, "hex"), 
      Buffer.from(ivHex, "hex")
    );
    
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    // trying to decrypt it back into plain text
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    // If the auth tag doesn't match or the key is wrong, we land here
    console.error("Oops! Decryption failed. Did someone tamper with the DB?", error);
    return null;
  }
};
