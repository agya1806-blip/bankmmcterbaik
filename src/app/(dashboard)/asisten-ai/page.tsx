"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bot, ArrowLeft, Send, User, Loader2 } from "lucide-react";
import { buildAiContext } from "@/lib/aiContext";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const WELCOME_MSG: ChatMessage = {
  role: "assistant",
  text: "Halo! Saya asisten keuangan MMCBANK. Tanya saya tentang analisis keuangan, perbandingan performa antar cabang, atau insight bisnis lainnya.",
};

export default function AsistenAIPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextReady, setContextReady] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      let contextStr = "";
      if (!contextReady) {
        const ctx = await buildAiContext();
        contextStr = ctx.ringkasanKeuangan;
        setContextReady(true);
      } else {
        const ctx = await buildAiContext();
        contextStr = ctx.ringkasanKeuangan;
      }

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, context: contextStr }),
      });

      if (!res.ok) throw new Error("Gagal hubungi AI");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Maaf, saya tidak bisa menjawab saat ini. Periksa koneksi internet atau API key.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, contextReady]);

  if (!mounted) {
    return <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/30 animate-pulse" />;
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 shrink-0">
        <button onClick={() => router.push("/")}
          className="size-9 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-100 dark:bg-[#131527]/90 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-all active:scale-[0.97]"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </button>
        <div className="size-10 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#7B61FF]/80 flex items-center justify-center shadow-lg shadow-[#7B61FF]/25">
          <Bot className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold">Tanya AI</h1>
          <p className="text-[10px] text-muted-foreground">Asisten analisis keuangan</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-3 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="size-8 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#7B61FF]/80 flex items-center justify-center shrink-0 mt-1">
                <Bot className="size-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white rounded-br-md"
                  : "bg-slate-100 dark:bg-[#131527]/90 text-slate-700 dark:text-slate-200 rounded-bl-md border border-slate-200/60 dark:border-slate-700/50"
              }`}
            >
              {m.text}
            </div>
            {m.role === "user" && (
              <div className="size-8 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-100 dark:bg-[#131527] flex items-center justify-center shrink-0 mt-1">
                <User className="size-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="size-8 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#7B61FF]/80 flex items-center justify-center shrink-0">
              <Bot className="size-4 text-white" />
            </div>
            <div className="rounded-2xl px-4 py-2.5 bg-slate-100 dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-700/50">
              <Loader2 className="size-4 animate-spin text-[#7B61FF]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 pt-2 pb-4 safe-bottom shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Tanya analisis keuangan..."
            rows={1}
            className="flex-1 rounded-2xl bg-white dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-700/50 text-xs px-4 py-3 resize-none focus:outline-none focus:border-[#7B61FF]/40 focus:ring-2 focus:ring-[#7B61FF]/15 placeholder:text-muted-foreground"
            style={{ minHeight: 44, maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="size-10 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white flex items-center justify-center shadow-lg disabled:opacity-50 active:scale-90 transition-all shrink-0"
            style={{ minHeight: 40, minWidth: 40 }}
          >
            <Send className="size-5" />
          </button>
        </div>
        <p className="text-[8px] text-muted-foreground text-center mt-1">
          AI dapat membuat kesalahan. Verifikasi data penting secara manual.
        </p>
      </div>
    </div>
  );
}
