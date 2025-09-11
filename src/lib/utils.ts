import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// WARNING: This is a simple obfuscation and not a secure encryption method.
// It should not be used in a production environment for handling sensitive data.
export function encodePassword(password: string): string {
  try {
    return btoa(password);
  } catch (error) {
    console.error("Failed to encode password:", error);
    return password; // Fallback to plain text if encoding fails
  }
}

export function decodePassword(encoded: string): string {
  try {
    return atob(encoded);
  } catch (error) {
    console.error("Failed to decode password:", error);
    return encoded; // Fallback to encoded text if decoding fails
  }
}
