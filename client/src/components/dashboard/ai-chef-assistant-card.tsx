import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Bot, User, ChefHat } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChefAssistantCard() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI Chef Assistant. Ask me for recipe ideas, cooking tips, or help with ingredients!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-chef/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user?.id, messages: newMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response from AI Chef");
      }

      const data = await response.json();
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      console.error("Error sending message to AI Chef:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: `Sorry, I encountered an error. ${(error as Error).message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl glass-effect rounded-xl border border-neutral-800">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-2">
            <ChefHat className="h-8 w-8 text-primary-500 mr-2" />
            <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-500">AI Chef Assistant</CardTitle>
        </div>
        <CardDescription className="text-neutral-400">
          Get recipe ideas, cooking instructions, or ingredient substitutions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-neutral-900/60 rounded-lg mb-4 border border-neutral-700">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <Bot className="h-6 w-6 text-primary-500 flex-shrink-0" />
              )}
              <div
                className={`max-w-[70%] p-3 rounded-xl text-sm ${msg.role === "user"
                    ? "bg-primary-600 text-primary-50 rounded-tr-none"
                    : "bg-neutral-700 text-neutral-100 rounded-tl-none"}`}>
                {msg.content}
              </div>
              {msg.role === "user" && (
                <User className="h-6 w-6 text-neutral-400 flex-shrink-0" />
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center justify-start gap-2">
              <Bot className="h-6 w-6 text-primary-500 flex-shrink-0" />
              <div className="max-w-[70%] p-3 rounded-lg bg-neutral-700 text-neutral-100 rounded-tl-none">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'Suggest a quick dinner recipe with chicken'"
            className="flex-grow bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:ring-primary-500 focus:border-primary-500 rounded-md"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-primary-600 hover:bg-primary-700 text-white rounded-md">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Send"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}