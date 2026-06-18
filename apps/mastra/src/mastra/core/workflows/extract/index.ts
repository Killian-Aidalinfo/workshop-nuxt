import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { step1 } from "./step1";
import { stepIdCard } from "./stepIdCard";
export const testWorkflow = createWorkflow({
  id: "test-workflow",
  stateSchema: z.any(),
  inputSchema: z.object({
    urlFile: z.string()
  }),
  outputSchema: z.object({
    output: z.string()
  })
})
  .then(step1)
  .branch([
    [async ({ inputData }) => inputData.typeOfImg.type === "id_card", stepIdCard],
  ])
  .commit();