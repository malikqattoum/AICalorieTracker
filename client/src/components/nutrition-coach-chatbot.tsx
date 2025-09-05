import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export function NutritionCoachChatbot({ userId }: { userId?: number }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; imageData?: string }>>([
    { role: "assistant", content: "Hi! I'm your Nutrition Coach. Ask me anything about your meals, nutrition, or healthy eating!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageData, setImageData] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImageData(base64.split(',')[1]); // Remove the data:image/jpeg;base64, prefix
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !imageData) return;
    const messageContent = input || "What's in this image?";
    setMessages((msgs) => [...msgs, { role: "user", content: messageContent, imageData: imageData ? `data:image/jpeg;base64,${imageData}` : undefined }]);
    setLoading(true);
    setInput("");
    setSelectedImage(null);
    setImageData("");
    try {
      const payload: any = { question: messageContent };
      if (imageData) {
        payload.imageData = imageData;
      }
      const res = await apiRequest("POST", "/api/user/nutrition-coach/ask", payload);
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
              <div className={`inline-block px-3 py-2 rounded-lg max-w-xs ${msg.role === "user" ? "bg-primary-700 text-primary-50" : "bg-emerald-800 text-emerald-100"}`}>
                {msg.imageData && (
                  <img src={msg.imageData} alt="Uploaded" className="w-32 h-32 object-cover rounded mb-2" />
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-emerald-400">Coach is typing...</div>}
        </div>
        {selectedImage && (
          <div className="mb-2">
            <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="w-20 h-20 object-cover rounded" />
            <button
              onClick={() => {
                setSelectedImage(null);
                setImageData("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="ml-2 text-red-400 hover:text-red-300 text-sm"
            >
              Remove
            </button>
          </div>
        )}
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-700 hover:bg-blue-600 text-blue-50 font-semibold px-3 py-2 rounded shadow"
            disabled={loading}
            title="Upload image"
          >
            📷
          </button>
          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-600 text-emerald-50 font-semibold px-4 py-2 rounded shadow"
            disabled={loading || (!input.trim() && !imageData)}
          >
            Send
          </button>
        </form>
      </CardContent>
    </Card>
  );
}