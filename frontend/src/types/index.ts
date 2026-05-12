export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatListItem {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface Chat extends ChatListItem {
  user_id: string;
  messages: Message[];
}

export interface StreamChunk {
  content?: string;
  done?: boolean;
  error?: string;
}
