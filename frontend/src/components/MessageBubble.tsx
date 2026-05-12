"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function parseAssistantContent(raw: string) {
  const openTag = "<think>";
  const closeTag = "</think>";
  const openIdx = raw.indexOf(openTag);

  if (openIdx === -1) {
    return {
      thinking: "",
      answer: raw,
      thinkingInProgress: false,
    };
  }

  const before = raw.slice(0, openIdx);
  const afterOpen = raw.slice(openIdx + openTag.length);
  const closeIdx = afterOpen.indexOf(closeTag);

  if (closeIdx === -1) {
    return {
      thinking: afterOpen,
      answer: before,
      thinkingInProgress: true,
    };
  }

  const thinking = afterOpen.slice(0, closeIdx);
  const after = afterOpen.slice(closeIdx + closeTag.length);

  return {
    thinking,
    answer: `${before}${after}`,
    thinkingInProgress: false,
  };
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const parsed = !isUser ? parseAssistantContent(message.content) : null;
  const showPending = !isUser && isStreaming && message.content.trim().length === 0;

  return (
    <div
      className={cn(
        "flex w-full animate-slide-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center flex-shrink-0 mt-0.5 mr-2.5 text-[11px]">
          🦙
        </div>
      )}

      <div
        className={cn(
          "max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-ink text-white rounded-tr-sm"
            : "bg-surface border border-surface-border text-ink rounded-tl-sm"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : showPending ? (
          <div className="flex items-center gap-2.5 text-ink-secondary">
            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-ink-ghost/40 border-t-ink border-r-ink" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-ink">
            {!!parsed?.thinking.trim() && (
              <details
                open={!!isStreaming || parsed.thinkingInProgress}
                className="mb-2 rounded-lg border border-surface-border bg-surface-subtle px-3 py-2"
              >
                <summary className="cursor-pointer select-none text-xs font-medium text-ink-secondary">
                  {parsed.thinkingInProgress ? "Thinking" : "Thought process"}
                </summary>
                <p className="mt-2 mb-0 whitespace-pre-wrap text-xs text-ink-secondary">
                  {parsed.thinking.trim()}
                </p>
              </details>
            )}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className ?? "");
                  const isBlock = !!match;
                  return isBlock ? (
                    <SyntaxHighlighter
                      style={oneLight as Record<string, React.CSSProperties>}
                      language={match[1]}
                      PreTag="div"
                      className="!rounded-lg !text-xs !my-2"
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className="bg-surface-muted text-ink rounded px-1 py-0.5 font-mono text-[0.8em]"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {parsed?.answer ?? message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-flex gap-0.5 ml-1 align-middle">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-ink-ghost animate-pulse-dot"
                    style={{ animationDelay: `${i * 0.16}s` }}
                  />
                ))}
              </span>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-6 h-6 rounded-full bg-ink flex items-center justify-center flex-shrink-0 mt-0.5 ml-2.5 text-[10px] text-white font-semibold">
          U
        </div>
      )}
    </div>
  );
}
