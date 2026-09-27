import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { SYSTEM_PROMPT } from './prompt';
import { getContact } from './tools/getContact';
import { getCrazy } from './tools/getCrazy';
import { getInternship } from './tools/getIntership';
import { getPresentation } from './tools/getPresentation';
import { getProjects } from './tools/getProjects';
import { getResume } from './tools/getResume';
import { getSkills } from './tools/getSkills';
import { getSports } from './tools/getSport';
import {
  FREE_MESSAGE_LIMIT,
  getClientIdentifiers,
  getServerTracking,
  incrementServerCount,
} from '@/lib/server-tracking';

export const maxDuration = 30;

function errorHandler(error: unknown) {
  if (error == null) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error);
}

export async function POST(req: Request) {
  try {
    const keys = getClientIdentifiers(req);
    const serverRec = getServerTracking(keys);

    const cookieHeader = req.headers.get('cookie') || '';
    const countMatch = cookieHeader.match(/(?:^|; )fastfolio_message_count=([^;]*)/);
    const extraMatch = cookieHeader.match(/(?:^|; )fastfolio_extra_messages=([^;]*)/);
    const cookieCount = countMatch ? parseInt(decodeURIComponent(countMatch[1]), 10) : 0;
    const cookieExtra = extraMatch ? parseInt(decodeURIComponent(extraMatch[1]), 10) : 0;

    const count = Math.max(serverRec.count, isNaN(cookieCount) ? 0 : cookieCount);
    const extra = Math.max(serverRec.extra, isNaN(cookieExtra) ? 0 : cookieExtra);
    const totalAllowed = FREE_MESSAGE_LIMIT + extra;

    if (count >= totalAllowed) {
      console.log(`[CHAT-API] Blocked request: limit reached (${count}/${totalAllowed}) for keys:`, keys);
      return new Response(
        JSON.stringify({
          error: 'Free message limit reached. Please unlock more messages to continue.',
          limitReached: true,
          count,
          totalAllowed,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `fastfolio_message_count=${count}; Path=/; Max-Age=31536000; SameSite=Lax`,
          },
        }
      );
    }

    // Increment count on server for this IP & fingerprint
    const newCount = incrementServerCount(keys);
    console.log(`[CHAT-API] Allowed request (${newCount}/${totalAllowed}) for keys:`, keys);

    const { messages } = await req.json();
    console.log('[CHAT-API] Incoming messages count:', messages?.length);

    messages.unshift(SYSTEM_PROMPT);

    const tools = {
      getProjects,
      getPresentation,
      getResume,
      getContact,
      getSkills,
      getSports,
      getCrazy,
      getInternship,
    };

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages,
      toolCallStreaming: true,
      tools,
      maxSteps: 2,
    });

    const headers: Record<string, string> = {
      'Set-Cookie': `fastfolio_message_count=${newCount}; Path=/; Max-Age=31536000; SameSite=Lax`,
    };

    return result.toDataStreamResponse({
      getErrorMessage: errorHandler,
      headers,
    });
  } catch (err) {
    console.error('Global error:', err);
    const errorMessage = errorHandler(err);
    return new Response(errorMessage, { status: 500 });
  }
}
