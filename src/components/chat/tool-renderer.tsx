// src/components/chat/tool-renderer.tsx
'use client';

import dynamic from 'next/dynamic';

const Contact = dynamic(() => import('../contact').then((mod) => mod.Contact), {
  loading: () => <div className="h-28 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800" />,
});

const Crazy = dynamic(() => import('../crazy'), {
  loading: () => <div className="h-28 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800" />,
});

const InternshipCard = dynamic(() => import('../InternshipCard'), {
  loading: () => <div className="h-28 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800" />,
});

const Presentation = dynamic(() => import('../presentation').then((mod) => mod.Presentation), {
  loading: () => <div className="h-28 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800" />,
});

const AllProjects = dynamic(() => import('../projects/AllProjects'), {
  loading: () => <div className="h-48 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800" />,
});

const Resume = dynamic(() => import('../resume'), {
  loading: () => <div className="h-48 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800" />,
});

const Skills = dynamic(() => import('../skills'), {
  loading: () => <div className="h-28 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800" />,
});

interface ToolRendererProps {
  toolInvocations: any[];
  messageId: string;
}

export default function ToolRenderer({
  toolInvocations,
}: ToolRendererProps) {
  return (
    <div className="w-full transition-all duration-300">
      {toolInvocations.map((tool) => {
        const { toolCallId, toolName } = tool;

        switch (toolName) {
          case 'getProjects':
            return (
              <div key={toolCallId} className="w-full overflow-hidden rounded-lg">
                <AllProjects />
              </div>
            );

          case 'getPresentation':
            return (
              <div key={toolCallId} className="w-full overflow-hidden rounded-lg">
                <Presentation />
              </div>
            );

          case 'getResume':
            return (
              <div key={toolCallId} className="w-full rounded-lg">
                <Resume />
              </div>
            );

          case 'getContact':
            return (
              <div key={toolCallId} className="w-full rounded-lg">
                <Contact />
              </div>
            );

          case 'getSkills':
            return (
              <div key={toolCallId} className="w-full rounded-lg">
                <Skills />
              </div>
            );

          case 'getCrazy':
            return (
              <div key={toolCallId} className="w-full rounded-lg">
                <Crazy />
              </div>
            );

          case 'getInternship':
            return (
              <div key={toolCallId} className="w-full rounded-lg">
                <InternshipCard />
              </div>
            );

          default:
            return (
              <div
                key={toolCallId}
                className="bg-secondary/10 w-full rounded-lg p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-medium">{toolName}</h3>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-100">
                    Tool Result
                  </span>
                </div>
                <div className="mt-2">
                  {typeof tool.result === 'object' ? (
                    <pre className="bg-secondary/20 overflow-x-auto rounded p-3 text-sm">
                      {JSON.stringify(tool.result, null, 2)}
                    </pre>
                  ) : (
                    <p>{String(tool.result)}</p>
                  )}
                </div>
              </div>
            );
        }
      })}
    </div>
  );
}
