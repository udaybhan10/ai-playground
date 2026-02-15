import { ChatInterface } from "@/components/ChatInterface";

export default function ChatPage() {
    return (
        <div className="h-full">
            <h1 className="text-3xl font-bold mb-6">Chat</h1>
            <ChatInterface />
        </div>
    );
}
