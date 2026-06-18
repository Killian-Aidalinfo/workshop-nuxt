import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ocrAgent } from "../../agents/ocrAgents";

const idCardSchema = z.object({
  lastName: z.string(),
  firstName: z.string(),
  birthDate: z.string(),
  birthPlace: z.string(),
  nationality: z.string(),
  gender: z.enum(["M", "F", "unknown"]),
  documentNumber: z.string(),
  expiryDate: z.string(),
  issueDate: z.string().optional(),
  issuingAuthority: z.string().optional(),
  address: z.string().optional(),
  mrz: z.object({
    line1: z.string(),
    line2: z.string(),
  }).optional(),
  confidence: z.number().min(0).max(1),
});

export const stepIdCard = createStep({
  id: "step-id-card",
  stateSchema: z.object({
    document: z.any(),
  }),
  outputSchema: z.object({
    idCard: idCardSchema,
  }),
  execute: async ({ state }) => {
    const { document } = state;

    const response = await ocrAgent.generate(
      [
        {
          role: "user",
          content: [
            document,
            {
              type: "text",
              text: "Extract all information from this identity card. Include all visible fields: names, birth date and place, nationality, gender, document number, expiry date, issuing authority, address if present, and the MRZ lines at the bottom.",
            },
          ],
        },
      ],
      {
        structuredOutput: { schema: idCardSchema },
        providerOptions: {
          scaleway: { reasoningEffort: "none" },
        },
      },
    );

    return { idCard: response.object };
  },
});
