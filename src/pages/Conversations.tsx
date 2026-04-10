import { useState } from "react";
import { Lightbulb, ChevronRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CONVERSATION_PROMPTS } from "@/lib/store";

export default function Conversations() {
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const categories = [...new Set(CONVERSATION_PROMPTS.map((p) => p.category))];

  const randomPrompt = () => {
    const idx = Math.floor(Math.random() * CONVERSATION_PROMPTS.length);
    setActivePrompt(CONVERSATION_PROMPTS[idx].id);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-foreground">Guided Conversations</h1>
        <p className="mt-2 text-muted-foreground">Pre-built prompts to help you start meaningful conversations step by step.</p>

        <div className="mt-6">
          <Button onClick={randomPrompt} variant="outline" className="gap-2">
            <RotateCw className="h-4 w-4" /> Random Prompt
          </Button>
        </div>

        {categories.map((cat) => (
          <div key={cat} className="mt-8">
            <h2 className="font-display text-lg font-semibold text-foreground mb-3">{cat}</h2>
            <div className="space-y-3">
              {CONVERSATION_PROMPTS.filter((p) => p.category === cat).map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => setActivePrompt(activePrompt === prompt.id ? null : prompt.id)}
                  className={`w-full text-left rounded-xl border p-5 transition-all ${
                    activePrompt === prompt.id
                      ? "border-lavender bg-lavender-light shadow-hover"
                      : "border-border bg-card shadow-card hover:shadow-hover hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Lightbulb className={`h-5 w-5 mt-0.5 shrink-0 ${activePrompt === prompt.id ? "text-lavender" : "text-muted-foreground"}`} />
                      <div>
                        <p className="font-medium text-foreground">{prompt.prompt}</p>
                        <Badge variant="outline" className="mt-2 text-xs">{prompt.difficulty}</Badge>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${activePrompt === prompt.id ? "rotate-90" : ""}`} />
                  </div>
                  {activePrompt === prompt.id && (
                    <div className="mt-4 ml-8 text-sm text-muted-foreground animate-fade-in">
                      <p className="font-medium text-foreground mb-2">Tips for this conversation:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Start with a short, honest answer</li>
                        <li>It's okay to pause and think</li>
                        <li>Share as much or as little as you're comfortable with</li>
                        <li>Remember: there are no wrong answers here</li>
                      </ul>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
