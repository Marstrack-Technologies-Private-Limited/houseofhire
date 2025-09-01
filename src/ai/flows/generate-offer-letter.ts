'use server';

/**
 * @fileOverview A flow for generating offer letters.
 *
 * - generateOfferLetter - A function that generates an offer letter.
 * - GenerateOfferLetterInput - The input type for the generateOfferLetter function.
 * - GenerateOfferLetterOutput - The return type for the generateOfferLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOfferLetterInputSchema = z.object({
  candidateName: z.string().describe('The name of the candidate.'),
  jobTitle: z.string().describe('The title of the job being offered.'),
  companyName: z.string().describe('The name of the company making the offer.'),
  startDate: z.string().describe('The start date of the employment.'),
  salary: z.number().describe('The annual salary for the position.'),
  benefits: z.string().describe('A description of the benefits offered.'),
});
export type GenerateOfferLetterInput = z.infer<typeof GenerateOfferLetterInputSchema>;

const GenerateOfferLetterOutputSchema = z.object({
  offerLetterHtml: z.string().describe('The generated offer letter in HTML format.'),
});
export type GenerateOfferLetterOutput = z.infer<typeof GenerateOfferLetterOutputSchema>;

export async function generateOfferLetter(input: GenerateOfferLetterInput): Promise<GenerateOfferLetterOutput> {
  return generateOfferLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOfferLetterPrompt',
  input: {schema: GenerateOfferLetterInputSchema},
  output: {schema: GenerateOfferLetterOutputSchema},
  prompt: `You are an expert HR assistant. Generate a formal offer letter in HTML format based on the following information:

  Candidate Name: {{{candidateName}}}
  Job Title: {{{jobTitle}}}
  Company Name: {{{companyName}}}
  Start Date: {{{startDate}}}
  Salary: \${{{salary}}}
  Benefits: {{{benefits}}}

  The HTML should be well-formatted and include standard offer letter sections such as:
  - Introduction
  - Job Title and Responsibilities
  - Compensation and Benefits
  - Start Date
  - At-Will Employment
  - Company Information
  - Signature
  - Include the following CSS styles to make it more modern looking:
body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 20px;
}
h1 {
  color: #1E3A8A;
  border-bottom: 2px solid #1E3A8A;
  padding-bottom: 5px;
}
p {
  margin-bottom: 10px;
}
.section {
  margin-top: 20px;
}
.company-info {
  margin-top: 30px;
  font-style: italic;
  color: #555;
}

Keep the HTML simple and semantic.
`,
});

const generateOfferLetterFlow = ai.defineFlow(
  {
    name: 'generateOfferLetterFlow',
    inputSchema: GenerateOfferLetterInputSchema,
    outputSchema: GenerateOfferLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
