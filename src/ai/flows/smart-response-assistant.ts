'use server';
/**
 * @fileOverview A Genkit flow for the Smart Response Assistant feature.
 *
 * - smartResponseAssistant - A function that suggests professional technical responses based on complaint details and resolution history.
 * - SmartResponseAssistantInput - The input type for the smartResponseAssistant function.
 * - SmartResponseAssistantOutput - The return type for the smartResponseAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartResponseAssistantInputSchema = z.object({
  complaintDetails: z
    .string()
    .describe('Detailed description of the customer complaint.'),
  resolutionHistory:
    z.array(z.string())
      .optional()
      .describe('Optional array of past resolution summaries or examples.'),
});
export type SmartResponseAssistantInput = z.infer<
  typeof SmartResponseAssistantInputSchema
>;

const SmartResponseAssistantOutputSchema = z.object({
  suggestedResponse:
    z.string().describe('A professionally suggested technical response.'),
});
export type SmartResponseAssistantOutput = z.infer<
  typeof SmartResponseAssistantOutputSchema
>;

export async function smartResponseAssistant(
  input: SmartResponseAssistantInput
): Promise<SmartResponseAssistantOutput> {
  return smartResponseAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartResponseAssistantPrompt',
  input: {schema: SmartResponseAssistantInputSchema},
  output: {schema: SmartResponseAssistantOutputSchema},
  prompt: `You are an expert banking specialist providing professional technical responses to customer complaints.
Analyze the following complaint details and provide a concise, professional, and technical response.

Complaint Details:
{{{complaintDetails}}}

{{#if resolutionHistory}}
Consider the following past resolution examples for context:
{{#each resolutionHistory}}
- {{{this}}}
{{/each}}
{{/if}}

Please provide only the suggested response, without any additional conversational text.`,
});

const smartResponseAssistantFlow = ai.defineFlow(
  {
    name: 'smartResponseAssistantFlow',
    inputSchema: SmartResponseAssistantInputSchema,
    outputSchema: SmartResponseAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
