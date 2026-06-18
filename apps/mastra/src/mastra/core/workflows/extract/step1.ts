import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { classificationAgent } from "../../agents/classification";
import { downloadDocument } from "./utils";

const classificationSchema = z.object({
  type: z.enum(["id_card", "invoice", "delivery_slip", "barcode", "unknown"]),
  confidence: z.number(),
});

export const step1 = createStep({
  id: "step-1",
  stateSchema: z.any(),
  inputSchema: z.object({
    urlFile: z.string(),
  }),
  outputSchema: z.object({
    typeOfImg: classificationSchema,
  }),
  execute: async ({ inputData, setState }) => {
    const { urlFile } = inputData;

    const pages = await downloadDocument(urlFile);
    await setState({ pages });

    const response = await classificationAgent.generate(
      [
        {
          role: "user",
          content: [
            ...pages,
            { type: "text", text: "Classify this document. Use exactly one of these types: 'id_card' (identity card, carte d'identité, passeport), 'invoice' (invoice, facture, bill), 'delivery_slip' (delivery slip, bon de livraison), 'barcode' (barcode image), 'unknown' (anything else). Provide a confidence score between 0 and 1." },
          ],
        },
      ],
      {
        structuredOutput: { schema: classificationSchema },
      },
    );

    console.log("Classification result:", response.object);

    return {
      typeOfImg: {
        type: response.object?.type ?? "unknown",
        confidence: response.object?.confidence ?? 0,
      },
    };
  },
});
