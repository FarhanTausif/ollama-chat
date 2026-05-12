"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import {
  createChat,
  deleteChat,
  fetchChat,
  fetchChats,
  fetchModels,
  sendMessage,
} from "@/lib/api";
import type { Chat, ChatListItem, Message } from "@/types";

export default function ChatPage() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("llama3.2");
  const [ollamaStatus, setOllamaStatus] = useState<"checking" | "online" | "offline">("checking");

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // ── Helpers ────────────────────────────────────────────────────────────────
  const token = useCallback(async () => {
    const t = await getToken();
    if (!t) throw new Error("Not authenticated");
    return t;
  }, [getToken]);

  // ── Load chats + models on mount ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const t = await token();
        const [chatList, models] = await Promise.all([
          fetchChats(t),
          fetchModels(t),
        ]);
        setChats(chatList);
        if (models.length > 0) {
          setAvailableModels(models);
          setSelectedModel(models[0]);
          setOllamaStatus("online");
        } else {
          setOllamaStatus("offline");
        }
      } catch {
        setOllamaStatus("offline");
      }
    })();
  }, [token]);

  // ── Select a chat ──────────────────────────────────────────────────────────
  const handleSelectChat = useCallback(
    async (id: string) => {
      if (id === activeChatId) return;
      setActiveChatId(id);
      setMessages([]);
      setLoadingChat(true);
      try {
        const t = await token();
        const chat: Chat = await fetchChat(t, id);
        setMessages(chat.messages);
      } finally {
        setLoadingChat(false);
      }
    },
    [activeChatId, token]
  );

  // ── New chat ───────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(async () => {
    try {
      const t = await token();
      const chat = await createChat(t, "New Chat", selectedModel);
      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  }, [token, selectedModel]);

  // ── Delete chat ────────────────────────────────────────────────────────────
  const handleDeleteChat = useCallback(
    async (id: string) => {
      try {
        const t = await token();
        await deleteChat(t, id);
        setChats((prev) => prev.filter((c) => c.id !== id));
        if (activeChatId === id) {
          setActiveChatId(null);
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to delete chat:", err);
      }
    },
    [activeChatId, token]
  );

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (content: string) => {
      if (!activeChatId || isStreaming) return;

      // Optimistically add user message
      const optimisticUser: Message = {
        id: `__opt_user_${Date.now()}`,
        chat_id: activeChatId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUser]);
      setIsStreaming(true);
      setStreamingContent("");

      try {
        const t = await token();
        let full = "";

        await sendMessage(
          t,
          activeChatId,
          content,
          selectedModel,
          (chunk) => {
            full += chunk;
            setStreamingContent(full);
          },
          () => {
            // Replace streaming placeholder with real message
            const finalMsg: Message = {
              id: `__final_${Date.now()}`,
              chat_id: activeChatId,
              role: "assistant",
              content: full,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, finalMsg]);
            setStreamingContent("");
            setIsStreaming(false);

            // Update chat title in list (it may have changed after first message)
            fetchChats(t)
              .then(setChats)
              .catch(() => {});
          },
          (err) => {
            console.error("Stream error:", err);
            setIsStreaming(false);
            setStreamingContent("");
          }
        );
      } catch (err) {
        console.error("Send failed:", err);
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [activeChatId, isStreaming, selectedModel, token]
  );

  // ── Sign out ───────────────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push("/sign-in");
  }, [signOut, router]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        ollamaStatus={ollamaStatus}
        selectedModel={selectedModel}
        availableModels={availableModels}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onModelChange={setSelectedModel}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center px-6 py-3 border-b border-surface-border bg-white">
          <h1 className="text-sm font-medium text-ink">
            {activeChatId
              ? chats.find((c) => c.id === activeChatId)?.title ?? "Chat"
              : "New Chat"}
          </h1>
        </header>

        <ChatWindow
          chatId={activeChatId}
          messages={messages}
          isLoading={loadingChat}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          ollamaStatus={ollamaStatus}
          onSend={handleSend}
        />
      </main>
    </div>
  );
}
