import { createContext, useContext } from "react";

// Anonymous identity generator
const adjectives = ["Quiet", "Gentle", "Calm", "Serene", "Peaceful", "Soft", "Dreamy", "Cozy", "Warm", "Kind"];
const nouns = ["Soul", "Spirit", "Heart", "Mind", "Voice", "Breeze", "Cloud", "Star", "Wave", "Light"];

export function generateAnonymousName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

export interface Question {
  id: string;
  text: string;
  author: string;
  tag: string;
  timestamp: Date;
  upvotes: number;
  isPinned: boolean;
  isAnswered: boolean;
}

export interface Session {
  id: string;
  title: string;
  mentor: string;
  isLive: boolean;
  participantCount: number;
  questions: Question[];
}

export interface Discussion {
  id: string;
  topic: string;
  category: string;
  messages: DiscussionMessage[];
  participantCount: number;
}

export interface DiscussionMessage {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
  supportCount: number;
  replies: DiscussionMessage[];
}

export interface GroupTask {
  id: string;
  title: string;
  description: string;
  prompt: string;
  timeLimit: number; // minutes
  participants: string[];
  isActive: boolean;
}

export const TAGS = ["Career", "Social Anxiety", "Relationships", "Self-Growth", "Communication", "General"];

export const SAMPLE_SESSIONS: Session[] = [
  {
    id: "1",
    title: "Overcoming Social Anxiety in the Workplace",
    mentor: "Dr. Sarah Chen",
    isLive: true,
    participantCount: 24,
    questions: [
      { id: "q1", text: "How do I start small talk with colleagues?", author: "GentleSoul42", tag: "Social Anxiety", timestamp: new Date(), upvotes: 12, isPinned: true, isAnswered: false },
      { id: "q2", text: "What if I freeze during a presentation?", author: "QuietMind88", tag: "Career", timestamp: new Date(), upvotes: 8, isPinned: false, isAnswered: true },
      { id: "q3", text: "How to handle networking events?", author: "CalmBreeze55", tag: "Communication", timestamp: new Date(), upvotes: 5, isPinned: false, isAnswered: false },
    ],
  },
  {
    id: "2",
    title: "Building Meaningful Connections",
    mentor: "Prof. James Wright",
    isLive: false,
    participantCount: 56,
    questions: [],
  },
  {
    id: "3",
    title: "Finding Your Voice in Group Settings",
    mentor: "Maya Johnson",
    isLive: true,
    participantCount: 18,
    questions: [],
  },
];

export const SAMPLE_DISCUSSIONS: Discussion[] = [
  {
    id: "d1",
    topic: "Tips for making phone calls less stressful",
    category: "Social Anxiety",
    participantCount: 32,
    messages: [
      {
        id: "m1", author: "SereneStar77", text: "I always write down what I want to say before making a call. It really helps!", timestamp: new Date(), supportCount: 15,
        replies: [
          { id: "m1r1", author: "WarmHeart22", text: "This is such a great tip! I started doing this too and it made a huge difference.", timestamp: new Date(), supportCount: 8, replies: [] },
        ],
      },
      { id: "m2", author: "PeacefulCloud11", text: "Does anyone else rehearse conversations in their head?", timestamp: new Date(), supportCount: 22, replies: [] },
    ],
  },
  {
    id: "d2",
    topic: "Small wins this week — share yours!",
    category: "Self-Growth",
    participantCount: 45,
    messages: [],
  },
  {
    id: "d3",
    topic: "How to set boundaries politely",
    category: "Relationships",
    participantCount: 28,
    messages: [],
  },
];

export const SAMPLE_TASKS: GroupTask[] = [
  { id: "t1", title: "Introduce Yourself", description: "Share one interesting fact about yourself anonymously.", prompt: "Hi! I'm [your anonymous name] and something interesting about me is...", timeLimit: 5, participants: ["GentleSoul42", "QuietMind88"], isActive: true },
  { id: "t2", title: "Share an Opinion", description: "Express a gentle opinion on today's topic.", prompt: "I think that... because...", timeLimit: 3, participants: [], isActive: false },
  { id: "t3", title: "Ask a Follow-Up", description: "Build on someone else's answer with a curious question.", prompt: "That's interesting! Can you tell me more about...?", timeLimit: 3, participants: [], isActive: false },
];

export const CONVERSATION_PROMPTS = [
  { id: "cp1", category: "Getting Started", prompt: "What's something you've been curious about lately?", difficulty: "Easy" },
  { id: "cp2", category: "Getting Started", prompt: "What's the most calming place you've ever been to?", difficulty: "Easy" },
  { id: "cp3", category: "Going Deeper", prompt: "Talk about a recent challenge you overcame.", difficulty: "Medium" },
  { id: "cp4", category: "Going Deeper", prompt: "What's a skill you'd love to learn and why?", difficulty: "Medium" },
  { id: "cp5", category: "Building Connection", prompt: "What does a perfect day look like for you?", difficulty: "Easy" },
  { id: "cp6", category: "Building Connection", prompt: "Share something kind someone did for you recently.", difficulty: "Medium" },
];
