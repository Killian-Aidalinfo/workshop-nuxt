import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { step1 } from "./step1";
import { stepIdCard } from "./stepIdCard";
import { stepInvoice } from "./stepInvoice";

export const testWorkflow = createWorkflow({
  id: "test-workflow",
  stateSchema: z.any(),
  inputSchema: z.object({
    urlFile: z.string(),
    provider: z.enum(["scaleway", "ollama"]).default("scaleway"),
  }),
  outputSchema: z.any(),
})
  .then(step1)
  .branch([
    [async ({ inputData }) => inputData.typeOfImg.type === "id_card", stepIdCard],
    [async ({ inputData }) => inputData.typeOfImg.type === "invoice", stepInvoice],
  ])
  .commit();