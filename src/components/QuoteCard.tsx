"use client";

import { useEffect, useState } from "react";
import { Brain } from "lucide-react";

const quotes = [
  { text: "Sometimes it's the journey that teaches you a lot about your destination.", author: "Drake" },
  { text: "Smile more than you cry, give more than you take, and love more than you hate.", author: "Drake" },
  { text: "When all is said and done, more is always said than done.", author: "Drake" },
  { text: "Patience is key. In life we go through trials and tribulations, but you have to keep going.", author: "Drake" },
  { text: "The moment I stop having fun with it, I'll be done with it.", author: "Drake" },
  { text: "People will wish you all the success in the world, and then hate you when you get it.", author: "Drake" },
  { text: "Accept yourself. You don't have to prove anything to anyone.", author: "Drake" },
  { text: "Never let success get to your head, and never let failure get to your heart.", author: "Drake" },
  { text: "I was born to make mistakes, not to fake perfection.", author: "Drake" },
  { text: "Everybody has an addiction. Mine happens to be success.", author: "Drake" },
  { text: "Before you give up, think about why you held on for so long.", author: "Drake" },
  { text: "Count your blessings, not your problems.", author: "Drake" },
  { text: "Life can always change. You have to adjust.", author: "Drake" },
  { text: "Kill them with success and bury them with a smile.", author: "Drake" },
];

const QUEUE_KEY = "quoteCardQueue";

// Fisher-Yates shuffle of the quote indices.
function shuffledIndices(): number[] {
  const order = quotes.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Pop the next index off a persisted shuffled queue, reshuffling a fresh cycle
// when the queue runs out — so every quote shows once before any repeats.
function nextQuoteIndex(): number {
  let queue: number[] = [];
  try {
    queue = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    queue = [];
  }
  if (!Array.isArray(queue) || queue.length === 0) {
    queue = shuffledIndices();
  }
  const index = queue.shift() as number;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage failures (private mode, quota); still show a quote.
  }
  return index;
}

export default function QuoteCard() {
  // Start from a stable quote so server and first client render match (no
  // hydration mismatch), then advance the persisted cycle in the browser.
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    setQuote(quotes[nextQuoteIndex()]);
  }, []);

  return (
    <div className="rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 p-5 shadow-lg shadow-pink-200">
      <Brain size={18} className="text-pink-200 mb-3" />
      <p className="text-sm font-medium text-white leading-relaxed italic">"{quote.text}"</p>
      <p className="text-xs text-pink-200 mt-3">— {quote.author}</p>
    </div>
  );
}
