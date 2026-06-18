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
  execute: async ({ inputData, state, setState}) => {
    const { urlFile } = inputData;

    const document = await downloadDocument(urlFile);
    await setState({
      document: document,
    });
    console.log("Document downloaded:", document);
    const response = await classificationAgent.generate(
      [
        {
          role: "user",
          content: [
            document,
            { type: "text", text: "Classify this document." },
          ],
        },
      ],
      {
        structuredOutput: { schema: classificationSchema },
        providerOptions: {
          scaleway: {
            reasoningEffort: "none",
          },
        },
      },
    );
    return {
      typeOfImg: {
        type: response.object?.type ?? "unknown",
        confidence: response.object?.confidence ?? 0,
      },
    };
  },
});
