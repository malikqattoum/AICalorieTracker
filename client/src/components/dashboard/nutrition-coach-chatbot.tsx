import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NutritionCoachChatbot({ userId }: { userId?: number }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hi! I'm your Nutrition Coach. Ask me anything about your meals, nutrition, or healthy eating!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { role: "user", content: input }]);
    setLoading(true);
    setInput("");
    try {
      const res = await fetch("/api/nutrition-coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: [...messages, { role: "user", content: input }],
        }),
      });
      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setMessages((msgs) => [...msgs, { role: "assistant", content: "Sorry, I couldn't process your request." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <Card className="card-gradient glass-effect rounded-xl border border-neutral-800 max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Nutrition Coach Chatbot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 h-72 overflow-y-auto bg-neutral-900/60 rounded p-3 mb-3">
          {messages.map((msg, i) => (
            <div key={i} className={`text-sm ${msg.role === "user" ? "text-right" : "text-left"}`}>
              <span className={`inline-block px-3 py-2 rounded-lg ${msg.role === "user" ? "bg-primary-700 text-primary-50" : "bg-emerald-800 text-emerald-100"}`}>{msg.content}</span>
            </div>
          ))}
          {loading && <div className="text-xs text-emerald-400">Coach is typing...</div>}
        </div>
        <form
          className="flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <input
            ref={inputRef}
            className="flex-1 rounded px-3 py-2 bg-neutral-800 text-neutral-100 border border-neutral-700 focus:outline-none"
            placeholder="Ask me about your meals, e.g. 'Was my breakfast healthy?'"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-600 text-emerald-50 font-semibold px-4 py-2 rounded shadow"
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
