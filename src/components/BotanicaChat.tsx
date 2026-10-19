import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User as UserIcon, Loader2, Sparkles, Trash2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BotanicaChatProps {
  onClose: () => void;
}

export function BotanicaChat({ onClose }: BotanicaChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome to Sylva Botanica. I am your guide through this living green sanctuary. How may I assist your botanical exploration today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"gemini-3.8-flash" | "gemini-4-argon" | "gemini-3.1-flash-lite">("gemini-3.8-flash");

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Apologies, the forest connection was momentarily interrupted." },
        ]);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: "assistant",
        content: "Memory refreshed. What would you like to explore across the flora, soils, and canopy?",
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md pointer-events-auto">
      <div className="glass-panel w-full max-w-2xl h-[85vh] flex flex-col rounded-3xl overflow-hidden border border-white/20 shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-medium tracking-tight">Sylva Botanica Chat</h2>
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {selectedModel}
                </span>
              </div>
              <p className="text-xs text-white/50 font-light">Multi-turn Ecological & Botanical Stewardship AI</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              title="Clear conversation"
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Model Switcher Bar */}
        <div className="px-5 py-2.5 bg-black/30 border-b border-white/5 flex items-center justify-between gap-2 text-xs">
          <span className="text-white/40 text-[11px] font-light">Select Intelligence Tier:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setSelectedModel("gemini-3.8-flash")}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                selectedModel === "gemini-3.8-flash"
                  ? "bg-emerald-500/30 text-white font-medium border border-emerald-500/50"
                  : "text-white/60 hover:text-white"
              }`}
            >
              3.8 Flash (General)
            </button>
            <button
              onClick={() => setSelectedModel("gemini-4-argon")}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                selectedModel === "gemini-4-argon"
                  ? "bg-emerald-500/30 text-white font-medium border border-emerald-500/50"
                  : "text-white/60 hover:text-white"
              }`}
            >
              4 Argon (Deep STEM)
            </button>
            <button
              onClick={() => setSelectedModel("gemini-3.1-flash-lite")}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                selectedModel === "gemini-3.1-flash-lite"
                  ? "bg-emerald-500/30 text-white font-medium border border-emerald-500/50"
                  : "text-white/60 hover:text-white"
              }`}
            >
              3.1 Lite (Fast)
            </button>
          </div>
        </div>

        {/* Messages Thread (Scrollable) */}
        <div ref={scrollRef} className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs sm:text-sm font-light leading-relaxed ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[82%] px-4 py-2.5 rounded-2xl whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-emerald-500 text-zinc-950 font-normal"
                    : "bg-white/[0.05] border border-white/10 text-white/90"
                }`}
              >
                {m.content}
              </div>

              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-white/50 font-light">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span>Sylva Botanica is synthesizing ecological response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-white/10 bg-black/20 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about moss biology, spore mechanics, forest microclimates..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-medium text-xs hover:bg-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
