import { useState } from "react";
import { Lightbulb, ChevronRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONVERSATION_PROMPTS } from "@/lib/store";

const difficultyStyle: Record<string, string> = {
  Easy: "bg-mint/20 text-mint border-mint/30",
  Medium: "bg-amber/20 text-amber border-amber/30",
  Hard: "bg-coral/20 text-coral border-coral/30",
};

export default function Conversations() {
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const categories = [...new Set(CONVERSATION_PROMPTS.map((p) => p.category))];

  const randomPrompt = () => {
    const idx = Math.floor(Math.random() * CONVERSATION_PROMPTS.length);
    setActivePrompt(CONVERSATION_PROMPTS[idx].id);
  };

  return (
    <div className="container mx-auto max-w-3xl px-6 py-10 md:px-4 animate-page-in">
      <div className="animate-fade-up">
        <h1 className="font-display text-4xl font-medium text-foreground" style={{ fontVariationSettings: '"opsz" 96' }}>
          Guided <span className="font-italic-display text-violet">Conversations</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Pre-built prompts to help you start meaningful conversations step by step.</p>

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
                const isOpen = activePrompt === prompt.id;
                const diffClass = difficultyStyle[prompt.difficulty] ?? "bg-muted text-muted-foreground border-border";
                return (
                  <button
                    key={prompt.id}
                    onClick={() => setActivePrompt(isOpen ? null : prompt.id)}
                    className={`w-full text-left rounded-2xl border p-5 transition-all duration-300 ${
                      isOpen
                        ? "border-violet bg-violet/5 shadow-hover"
                        : "border-border bg-card shadow-soft hover:-translate-y-0.5 hover:shadow-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Lightbulb className={`h-5 w-5 mt-0.5 shrink-0 ${isOpen ? "text-violet" : "text-muted-foreground"}`} />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{prompt.prompt}</p>
                          <span className={`mt-2 inline-block text-xs px-2.5 py-0.5 rounded-full border font-medium ${diffClass}`}>
                            {prompt.difficulty}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-300 shrink-0 ${isOpen ? "rotate-90 text-violet" : ""}`} />
                    </div>
                    <div
                      className="grid transition-all duration-300 ease-out"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-4 ml-8 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground mb-2">Tips for this conversation:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Start with a short, honest answer</li>
                            <li>It's okay to pause and think</li>
                            <li>Share as much or as little as you're comfortable with</li>
                            <li>Remember: there are no wrong answers here</li>
                          </ul>
                        </div>
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
