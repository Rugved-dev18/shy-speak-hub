import { useState } from "react";
import { Link } from "react-router-dom";
import { Radio, Users, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_SESSIONS } from "@/lib/store";

export default function Sessions() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-foreground">Live Sessions</h1>
        <p className="mt-2 text-muted-foreground">Join a mentored session and ask questions anonymously in real time.</p>

        <div className="mt-8 space-y-4">
          {SAMPLE_SESSIONS.map((session) => (
            <div key={session.id} className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {session.isLive ? (
                      <Badge className="bg-mint text-primary-foreground border-0 animate-pulse-soft">
                        <Radio className="mr-1 h-3 w-3" /> Live
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" /> Upcoming
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{session.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Hosted by {session.mentor}</p>
                  <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {session.participantCount} participants</span>
                    <span>{session.questions.length} questions</span>
                  </div>
                </div>
                <Button variant="outline" className="shrink-0" asChild>
                  <Link to={`/session/${session.id}`}>
                    Join <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
