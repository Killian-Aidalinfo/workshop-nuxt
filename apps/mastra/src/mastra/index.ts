import { Mastra } from '@mastra/core';
import { testAgent } from './core/agents/test';

export const mastra = new Mastra({
  agents: { testAgent },
});
