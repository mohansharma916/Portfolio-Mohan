import { tool } from 'ai';
import { z } from 'zod';

export const getInternship = tool({
  description:
    "Gives a summary of what kind of Work/Project  I'm looking for, plus my contact info and how to reach me. Use this tool when the user asks about my Work ,Job search or how to contact me for opportunities.",
  parameters: z.object({}),
  execute: async () => {
    return `Here’s what I’m looking for 👇

- 📅 **Duration**: Any Duration 
- 🌍 **Location**: Preferably **Remote**
- 🧑‍💻 **Focus**: AI development, full-stack web apps, SaaS, agentic workflows
- 🛠️ **Stack**: React/Next.js, NestJS, TypeScript, Tailwind CSS, Python, PostgreSQL, AWS, GenAI
- 💼 **Visa**: Based in India (Open to Remote / Relocation & Sponsorship)
- ✅ **What I bring**: Real experience building scalable applications from 0 to 1M users, real-time communication, FFmpeg video processing, and custom AI tools.
- 🔥 I move fast, learn faster, and I’m ready for big engineering challenges

📬 **Contact me** via:
- Email: mohansharma3023@gmail.com
- LinkedIn: [linkedin.com/in/mohansharma916](https://www.linkedin.com/in/mohansharma916/)
- GitHub: [github.com/mohansharma916](https://github.com/mohansharma916)

Let's build cool things together ✌️
    `;
  },
});
