import { tool } from 'ai';
import { z } from 'zod';

export const getPresentation = tool({
  description:
    'This tool returns a concise personal introduction of Mohan Sharma. It is used to answer the question "Who are you?" or "Tell me about yourself"',
  parameters: z.object({}),
  execute: async () => {
    return {
      presentation:
        "I'm Mohan Sharma, a Full Stack  developer specializing in Frontend , Backend, GenAI, Cloud. A Traveller. I'm passionate about AI, tech, Entrepreneurship and SaaS tech.",
    };
  },
});
