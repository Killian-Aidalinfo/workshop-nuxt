import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { createOcrAgent, type Provider } from "../../agents/factory";

const invoiceLineSchema = z.object({
  description: z.string(),
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  totalPrice: z.number().optional(),
  vatRate: z.number().optional(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string(),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  seller: z.object({
    name: z.string(),
    address: z.string().optional(),
    siret: z.string().optional(),
    vatNumber: z.string().optional(),
    iban: z.string().optional(),
  }),
  buyer: z.object({
    name: z.string(),
    address: z.string().optional(),
    siret: z.string().optional(),
    vatNumber: z.string().optional(),
  }),
  lines: z.array(invoiceLineSchema),
  totalHT: z.number().optional(),
  totalVAT: z.number().optional(),
  totalTTC: z.number(),
  currency: z.string(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const stepInvoice = createStep({
  id: "step-invoice",
  stateSchema: z.object({
    pages: z.array(z.any()),
    provider: z.enum(["scaleway", "ollama"]).default("scaleway"),
  }),
  outputSchema: z.object({
    invoice: invoiceSchema,
  }),
  execute: async ({ state }) => {
    const { pages, provider } = state;
    const agent = createOcrAgent(provider as Provider);

    const response = await agent.generate(
      [
        {
          role: "user",
          content: [
            ...pages,
            {
              type: "text",
              text: "Extract all information from this invoice. Include seller and buyer details (name, address, SIRET, VAT number, IBAN), invoice number, dates, all line items with quantities and prices, subtotal, VAT breakdown, and total amount.",
            },
          ],
        },
      ],
      {
        structuredOutput: { schema: invoiceSchema },
        providerOptions: {
          scaleway: { reasoningEffort: "none" },
        },
      },
    );

    return { invoice: response.object };
  },
});
