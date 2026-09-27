'use client';
import { useChat } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// Component imports
import ChatBottombar from '@/components/chat/chat-bottombar';
import ChatLanding from '@/components/chat/chat-landing';
import ChatMessageContent from '@/components/chat/chat-message-content';
import {
  ChatBubble,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import { Info } from 'lucide-react';
import HelperBoost from './HelperBoost';
import { FastfolioCTA } from '@/components/fastfolio-cta';
import { PoweredByMohanSharma } from '@/components/powered-by-mohan';
import { FastfolioTracking, FREE_MESSAGE_LIMIT } from '@/lib/fastfolio-tracking';
import { getBrowserFingerprint } from '@/lib/fingerprint';

const FastfolioPopup = dynamic(
  () => import('@/components/mohan-popup').then((mod) => mod.FastfolioPopup),
  { ssr: false }
);
const WelcomeModal = dynamic(() => import('@/components/welcome-modal'), {
  ssr: false,
});
const SimplifiedChatView = dynamic(
  () => import('@/components/chat/simple-chat-view').then((mod) => mod.SimplifiedChatView),
  { ssr: false }
);

// ClientOnly component for client-side rendering
//@ts-ignore
const ClientOnly = ({ children }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
};

// Define Avatar component props interface
interface AvatarProps {
  hasActiveTool: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isTalking: boolean;
}

// Dynamic import of Avatar component
const Avatar = dynamic<AvatarProps>(
  () =>
    Promise.resolve(({ hasActiveTool, videoRef, isTalking }: AvatarProps) => {
      // This function will only execute on the client
      const isIOS = () => {
        // Multiple detection methods
        const userAgent = window.navigator.userAgent;
        const platform = window.navigator.platform;
        const maxTouchPoints = window.navigator.maxTouchPoints || 0;

        // UserAgent-based check
        const isIOSByUA =
          //@ts-ignore
          /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

        // Platform-based check
        const isIOSByPlatform = /iPad|iPhone|iPod/.test(platform);

        // iPad Pro check
        const isIPadOS =
          //@ts-ignore
          platform === 'MacIntel' && maxTouchPoints > 1 && !window.MSStream;

        // Safari check
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

        return isIOSByUA || isIOSByPlatform || isIPadOS || isSafari;
      };

      // Conditional rendering based on detection
      return (
        <div
          className={`flex items-center justify-center rounded-full transition-all duration-300 ${hasActiveTool ? 'h-20 w-20' : 'h-28 w-28'}`}
        >
          <div
            className="relative cursor-pointer"
            onClick={() => (window.location.href = '/')}
          >
            {isIOS() ? (
              <img
                src="/landing-memojis.png"
                alt="iOS avatar"
                className="h-full w-full scale-[1.8] object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                className="h-full w-full scale-[1.8] object-contain"
                muted
                playsInline
                loop
              >
                <source src="/final_memojis.webm" type="video/webm" />
                <source src="/final_memojis_ios.mp4" type="video/mp4" />
              </video>
            )}
          </div>
        </div>
      );
    }),
  { ssr: false }
);

const MOTION_CONFIG = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: {
    duration: 0.3,
    ease: 'easeOut',
  },
};

const Chat = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query');
  const initialQuerySubmittedRef = useRef(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [showFastfolioPopup, setShowFastfolioPopup] = useState(false);
  const [, forceUpdate] = useState({});

  const [storedCount, setStoredCount] = useState<number>(0);
  const [extraCount, setExtraCount] = useState<number>(0);
  const [isHydrated, setIsHydrated] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    setInput,
    reload,
    addToolResult,
    append,
  } = useChat({
    headers: typeof window !== 'undefined' ? {
      'x-device-fingerprint': getBrowserFingerprint(),
    } : undefined,
    onResponse: (response) => {
      if (response) {
        setLoadingSubmit(false);
        setIsTalking(true);
        if (videoRef.current) {
          videoRef.current.play().catch((error) => {
            console.error('Failed to play video:', error);
          });
        }
      }
    },
    onFinish: () => {
      setLoadingSubmit(false);
      setIsTalking(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    },
    onError: (error) => {
      setLoadingSubmit(false);
      setIsTalking(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      console.error('Chat error:', error.message, error.cause);
      if (error.message.includes('limit reached') || error.message.includes('429')) {
        setShowFastfolioPopup(true);
      } else {
        toast.error(`Error: ${error.message}`);
      }
    },
    onToolCall: (tool) => {
      const toolName = tool.toolCall.toolName;
      console.log('Tool call:', toolName);
    },
  });

  // Save active messages to sessionStorage so reloads preserve the visible conversation
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        sessionStorage.setItem('fastfolio_chat_history', JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  // Restore messages on initial mount if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('fastfolio_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch {}
    }
  }, []);

  const { currentAIMessage, latestUserMessage, hasActiveTool } = useMemo(() => {
    const latestAIMessageIndex = messages.findLastIndex(
      (m) => m.role === 'assistant'
    );
    const latestUserMessageIndex = messages.findLastIndex(
      (m) => m.role === 'user'
    );

    const result = {
      currentAIMessage:
        latestAIMessageIndex !== -1 ? messages[latestAIMessageIndex] : null,
      latestUserMessage:
        latestUserMessageIndex !== -1 ? messages[latestUserMessageIndex] : null,
      hasActiveTool: false,
    };

    if (result.currentAIMessage) {
      result.hasActiveTool =
        result.currentAIMessage.parts?.some(
          (part) =>
            part.type === 'tool-invocation' &&
            part.toolInvocation?.state === 'result'
        ) || false;
    }

    if (latestAIMessageIndex < latestUserMessageIndex) {
      result.currentAIMessage = null;
    }

    return result;
  }, [messages]);

  const isToolInProgress = messages.some(
    (m) =>
      m.role === 'assistant' &&
      m.parts?.some(
        (part) =>
          part.type === 'tool-invocation' &&
          part.toolInvocation?.state !== 'result'
      )
  );

  const initialStoredCountRef = useRef<number | null>(null);

  // Sync client storage and server-side IP/fingerprint tracking on mount
  useEffect(() => {
    setIsHydrated(true);
    const localCount = FastfolioTracking.getMessageCount();
    const localExtra = FastfolioTracking.getExtraMessages();
    initialStoredCountRef.current = localCount;
    setStoredCount(localCount);
    setExtraCount(localExtra);

    // Sync authoritative status from server
    FastfolioTracking.syncWithServer().then((status) => {
      setStoredCount(status.count);
      setExtraCount(status.extra);
      initialStoredCountRef.current = Math.max(initialStoredCountRef.current || 0, status.count);
    });
  }, []);

  const activeUserCount = useMemo(
    () => messages.filter((m) => m.role === 'user').length,
    [messages]
  );
  const totalAllowedMessages = FREE_MESSAGE_LIMIT + extraCount;
  const currentTotalUsed = Math.max(
    storedCount,
    (initialStoredCountRef.current ?? 0) + (activeUserCount > (initialStoredCountRef.current ?? 0) ? (activeUserCount - (initialStoredCountRef.current ?? 0)) : 0),
    activeUserCount
  );
  const hasReachedLimit = isHydrated && currentTotalUsed >= totalAllowedMessages;

  // Persist updated message count whenever activeUserCount increases
  useEffect(() => {
    if (activeUserCount > 0 && isHydrated) {
      const newTotal = Math.max(storedCount, activeUserCount, initialStoredCountRef.current ?? 0);
      FastfolioTracking.setMessageCount(newTotal);
      setStoredCount(newTotal);
    }
  }, [activeUserCount, isHydrated]);

  //@ts-ignore
  const submitQuery = (query) => {
    if (!query.trim() || isToolInProgress) return;

    // Check rate limit: user cannot send more than total allowed messages
    const currentActiveCount = messages.filter((m) => m.role === 'user').length;
    const checkTotal = Math.max(storedCount, currentActiveCount, currentTotalUsed);
    if (checkTotal >= totalAllowedMessages) {
      setShowFastfolioPopup(true);
      return;
    }
    
    setLoadingSubmit(true);
    append({
      role: 'user',
      content: query,
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resetFastfolio = async () => {
        await FastfolioTracking.resetForTesting();
        sessionStorage.clear();
        window.location.reload();
      };
    }

    if (videoRef.current) {
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.pause();
    }

    if (initialQuery && !initialQuerySubmittedRef.current) {
      initialQuerySubmittedRef.current = true;
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
      setInput('');
      submitQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (videoRef.current) {
      if (isTalking) {
        videoRef.current.play().catch((error) => {
          console.error('Failed to play video:', error);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isTalking]);

  //@ts-ignore
  const onSubmit = (e) => {
    e.preventDefault();
    
    // Check rate limit: user cannot send more than total allowed messages
    const currentActiveCount = messages.filter((m) => m.role === 'user').length;
    const checkTotal = Math.max(storedCount, currentActiveCount, currentTotalUsed);
    if (checkTotal >= totalAllowedMessages) {
      setShowFastfolioPopup(true);
      return;
    }
    
    if (!input.trim() || isToolInProgress) return;
    submitQuery(input);
    setInput('');
  };

  const handleStop = () => {
    stop();
    setLoadingSubmit(false);
    setIsTalking(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handlePaymentSuccess = () => {
    setShowFastfolioPopup(false);
    const updatedExtra = FastfolioTracking.getExtraMessages();
    setExtraCount(updatedExtra);
    FastfolioTracking.syncWithServer().then((status) => {
      setStoredCount(status.count);
      setExtraCount(status.extra);
    });
    forceUpdate({});
  };

  // Check if this is the initial empty state (no messages)
  const isEmptyState =
    !currentAIMessage && !latestUserMessage && !loadingSubmit;

  // Calculate header height based on hasActiveTool
  const headerHeight = hasActiveTool ? 100 : 180;

  return (
    <div className="relative h-screen overflow-hidden">
      <FastfolioCTA />
      <FastfolioPopup
        open={showFastfolioPopup}
        onOpenChange={setShowFastfolioPopup}
        hasReachedLimit={hasReachedLimit}
        onPaymentSuccess={handlePaymentSuccess}
      />
      <div className="absolute top-6 right-8 z-51 flex flex-col-reverse items-center justify-center gap-1 md:flex-row">
        <WelcomeModal
          trigger={
            <div className="hover:bg-accent cursor-pointer rounded-2xl px-3 py-1.5">
              <Info className="text-accent-foreground h-8" />
            </div>
          }
        />
      </div>

      {/* Fixed Avatar Header with Gradient */}
      <div
        className="fixed top-0 right-0 left-0 z-50"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 30%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 100%)',
        }}
      >
        <div
          className={`transition-all duration-300 ease-in-out ${hasActiveTool ? 'pt-6 pb-0' : 'py-6'}`}
        >
          <div className="flex justify-center">
            <ClientOnly>
              <Avatar
                hasActiveTool={hasActiveTool}
                videoRef={videoRef}
                isTalking={isTalking}
              />
            </ClientOnly>
          </div>

          <AnimatePresence>
            {latestUserMessage && !currentAIMessage && (
              <motion.div
                {...MOTION_CONFIG}
                className="mx-auto flex max-w-3xl px-4"
              >
                <ChatBubble variant="sent">
                  <ChatBubbleMessage>
                    <ChatMessageContent
                      message={latestUserMessage}
                      isLast={true}
                      isLoading={false}
                      reload={() => Promise.resolve(null)}
                    />
                  </ChatBubbleMessage>
                </ChatBubble>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto flex h-full max-w-3xl flex-col">
        {/* Scrollable Chat Content */}
        <div
          className="flex-1 overflow-y-auto px-2"
          style={{ paddingTop: `${headerHeight}px` }}
        >
          <AnimatePresence mode="wait">
            {isEmptyState ? (
              <motion.div
                key="landing"
                className="flex min-h-full items-center justify-center"
                {...MOTION_CONFIG}
              >
                <ChatLanding submitQuery={submitQuery} hasReachedLimit={hasReachedLimit} />
              </motion.div>
            ) : currentAIMessage ? (
              <div className="pb-4">
                <SimplifiedChatView
                  message={currentAIMessage}
                  isLoading={isLoading}
                  reload={reload}
                  addToolResult={addToolResult}
                />
              </div>
            ) : (
              loadingSubmit && (
                <motion.div
                  key="loading"
                  {...MOTION_CONFIG}
                  className="px-4 pt-18"
                >
                  <ChatBubble variant="received">
                    <ChatBubbleMessage isLoading />
                  </ChatBubble>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Fixed Bottom Bar */}
        <div className="sticky bottom-0 bg-white px-2 pt-3 md:px-0 md:pb-4">
          <div className="relative flex flex-col items-center gap-3">
            <HelperBoost
              submitQuery={submitQuery}
              setInput={setInput}
              hasReachedLimit={hasReachedLimit}
              onLimitReached={() => setShowFastfolioPopup(true)}
            />
            <div
              className={`w-full ${hasReachedLimit ? 'cursor-pointer [&_*]:pointer-events-none' : ''}`}
              onClick={hasReachedLimit ? () => setShowFastfolioPopup(true) : undefined}
            >
              <ChatBottombar
                input={hasReachedLimit ? 'Free limit reached. Tap to unlock 4 messages for ₹10' : input}
                handleInputChange={hasReachedLimit ? () => {} : handleInputChange}
                handleSubmit={onSubmit}
                isLoading={isLoading}
                stop={handleStop}
                isToolInProgress={isToolInProgress || hasReachedLimit}
                disabled={hasReachedLimit}
              />
            </div>
          </div>
          <PoweredByMohanSharma />
        </div>
      </div>
    </div>
  );
};

export default Chat;
