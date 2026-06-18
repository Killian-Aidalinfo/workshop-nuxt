import { Mastra } from '@mastra/core';
import { testAgent } from './core/agents/test';
import { testWorkflow } from './core/workflows/extract';
export const mastra = new Mastra({
  agents: { testAgent },
  workflows: { testWorkflow },
});
