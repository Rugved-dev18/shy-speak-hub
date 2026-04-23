import { useState, useRef, useEffect } from "react";
import { Lightbulb, RotateCw, Send, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CONVERSATION_PROMPTS } from "@/lib/store";
import { toast } from "@/hooks/use-toast";

const difficultyStyle: Record<string, string> = {
  Easy: "bg-mint/20 text-mint border-mint/30",
  Medium: "bg-amber/20 text-amber border-amber/30",
  Hard: "bg-coral/20 text-coral border-coral/30",
};

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conversation-guide`;

export default function Conversations() {
  const [activePrompt, setActivePrompt] = useState<typeof CONVERSATION_PROMPTS[number] | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const categories = [...new Set(CONVERSATION_PROMPTS.map((p) => p.category))];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const startPrompt = (prompt: typeof CONVERSATION_PROMPTS[number]) => {
    setActivePrompt(prompt);
    setMessages([]);
    setInput("");
    // Trigger initial AI greeting
    void streamReply([], prompt);
  };

  const randomPrompt = () => {
    const p = CONVERSATION_PROMPTS[Math.floor(Math.random() * CONVERSATION_PROMPTS.length)];
    startPrompt(p);
  };

  const streamReply = async (history: Msg[], prompt = activePrompt) => {
    if (!prompt) return;
    setIsStreaming(true);
    let assistantSoFar = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: history,
          prompt: prompt.prompt,
          difficulty: prompt.difficulty,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: "Failed to start conversation" }));
        toast({ title: "Couldn't reach the guide", description: errData.error, variant: "destructive" });
        setMessages((prev) => prev.slice(0, -1));
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantSoFar += delta;
              setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Connection issue", description: "Please try again.", variant: "destructive" });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    await streamReply(next);
  };

  // Active conversation view
  if (activePrompt) {
    const diffClass = difficultyStyle[activePrompt.difficulty] ?? "bg-muted text-muted-foreground border-border";
    return (
      <div className="container mx-auto max-w-3xl px-6 py-10 md:px-4 animate-page-in">
        <Button variant="ghost" size="sm" onClick={() => setActivePrompt(null)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to prompts
        </Button>

        <div className="rounded-2xl border border-violet/30 bg-violet/5 p-5 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-violet mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-violet/80 font-medium mb-1">{activePrompt.category}</p>
              <p className="font-display text-lg text-foreground font-medium">{activePrompt.prompt}</p>
              <span className={`mt-2 inline-block text-xs px-2.5 py-0.5 rounded-full border font-medium ${diffClass}`}>
                {activePrompt.difficulty}
              </span>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="rounded-2xl border border-border bg-card shadow-soft p-5 h-[420px] overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Your guide is getting ready...
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-violet text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}>
                {m.content || <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Share as much or as little as you want..."
            className="min-h-[60px] resize-none rounded-2xl"
            disabled={isStreaming}
          />
          <Button onClick={send} disabled={isStreaming || !input.trim()} className="h-[60px] gap-2 bg-violet hover:bg-violet/90 text-primary-foreground rounded-2xl">
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-center">There are no wrong answers. Take your time. 💛</p>
      </div>
    );
  }

  // Prompt list view
  return (
    <div className="container mx-auto max-w-3xl px-6 py-10 md:px-4 animate-page-in">
      <div className="animate-fade-up">
        <h1 className="font-display text-4xl font-medium text-foreground" style={{ fontVariationSettings: '"opsz" 96' }}>
          Guided <span className="font-italic-display text-violet">Conversations</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Pick a prompt — your AI guide will gently walk you through it, one step at a time.</p>

        <div className="mt-6">
          <Button onClick={randomPrompt} variant="outline" className="gap-2 border-[1.5px] border-violet text-violet hover:bg-violet hover:text-primary-foreground transition-colors">
            <RotateCw className="h-4 w-4" /> Random Prompt
          </Button>
        </div>

        {categories.map((cat) => (
          <div key={cat} className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">{cat}</h2>
            <div className="space-y-3">
              {CONVERSATION_PROMPTS.filter((p) => p.category === cat).map((prompt) => {
                const diffClass = difficultyStyle[prompt.difficulty] ?? "bg-muted text-muted-foreground border-border";
                return (
                  <button
                    key={prompt.id}
                    onClick={() => startPrompt(prompt)}
                    className="w-full text-left rounded-2xl border border-border bg-card p-5 shadow-soft hover:-translate-y-0.5 hover:shadow-hover hover:border-violet/40 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Lightbulb className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{prompt.prompt}</p>
                          <span className={`mt-2 inline-block text-xs px-2.5 py-0.5 rounded-full border font-medium ${diffClass}`}>
                            {prompt.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-violet text-sm font-medium shrink-0">
                        <Sparkles className="h-4 w-4" /> Start
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
