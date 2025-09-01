"use server";

import { generateOfferLetter, type GenerateOfferLetterInput } from '@/ai/flows/generate-offer-letter';

export async function generateOfferLetterAction(input: GenerateOfferLetterInput) {
  try {
    const result = await generateOfferLetter(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating offer letter:", error);
    return { success: false, error: "Failed to generate offer letter." };
  }
}
