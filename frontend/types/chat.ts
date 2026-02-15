export interface Message {
    role: "user" | "assistant";
    content: string;
}

export interface ChatSession {
    id: number;
    title: string;
    created_at: string;
}

export interface ChatHistoryResponse {
    session: ChatSession;
    messages: {
        role: string;
        content: string;
        created_at: string;
    }[];
}
