
import { tool } from "ai";
import { z } from "zod";


export const getSports = tool({
  description:
    "This tool will show some photos of Mohan Sharma doing travelling",
  parameters: z.object({}),
  execute: async () => {
    return "Here my best pictures of me doing Travelling!";
  },
});