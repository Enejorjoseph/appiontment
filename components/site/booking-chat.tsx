"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/field";
import type { BookingResult } from "@/lib/ai/booking-agent";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface BookingChatProps {
  loggedIn: boolean;
  patientName?: string;
}

const SUGGESTIONS = [
  "What services do you offer?",
  "Book a dental check-up",
  "What times are free tomorrow?",
];

export function BookingChat({ loggedIn, patientName }: BookingChatProps) {
  const firstName = patientName?.trim().split(/\s+/)[0] ?? "there";
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: loggedIn
        ? `Hi ${firstName}! I can help you book an appointment. What do you need help with?`
        : "Hi! I'm the CarePoint booking assistant. Please sign in so I can book an appointment for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingResult | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending || !loggedIn) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setError(null);
    setBooking(null);
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        booking?: BookingResult;
        requiresLogin?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.requiresLogin) {
        setMessages([...next, { role: "assistant", content: data.reply ?? "Please sign in first." }]);
        setError("Please sign in to continue booking.");
        return;
      }
      setMessages([
        ...next,
        { role: "assistant", content: data.reply ?? "Sorry, I didn't catch that." },
      ]);
      if (data.booking) setBooking(data.booking);
    } catch {
      setError("Could not reach the assistant. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="border-brand-200">
      <CardHeader
        title="Book with our AI assistant"
        description="Chat in plain English and I'll find services, check times and book it for you."
        className="rounded-t-2xl bg-gradient-to-r from-brand-50 to-white"
      />
      <CardBody className="space-y-4">
        {!loggedIn ? (
          <Alert variant="info" title="Sign in to book by chat">
            <p>
              The assistant books appointments on your account, so please{" "}
              <Link href="/login?next=%2Fbook" className="font-medium underline">
                sign in
              </Link>{" "}
              first.
            </p>
          </Alert>
        ) : null}

        <div className="max-h-96 space-y-3 overflow-y-auto rounded-xl border border-navy-100 bg-slate-50/70 p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  message.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2.5 text-sm text-white shadow-sm shadow-brand-600/20"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm border border-navy-100 bg-white px-4 py-2.5 text-sm text-navy-800"
                }
              >
                {message.content}
              </div>
            </div>
          ))}
          {pending ? (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-navy-100 bg-white px-4 py-2.5 text-sm text-slate-500">
                Typing…
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}

        {booking ? (
          <Alert variant="success" title="Appointment booked">
            <p>
              {booking.serviceName ? `${booking.serviceName} · ` : ""}
              {booking.date} at {booking.startTime}
              {booking.endTime ? `–${booking.endTime}` : ""}.
            </p>
            <p className="mt-1">
              Reference: <span className="font-mono font-semibold">{booking.reference}</span>
            </p>
            <Link
              href={`/booking/${booking.reference}`}
              className={buttonClass({ variant: "primary", size: "sm", className: "mt-2" })}
            >
              View appointment
            </Link>
          </Alert>
        ) : null}

        {loggedIn ? (
          <>
            {messages.length <= 1 ? (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    disabled={pending}
                    className="rounded-full border border-navy-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your message…"
                aria-label="Message"
                disabled={pending}
              />
              <Button type="submit" disabled={pending || input.trim().length === 0}>
                Send
              </Button>
            </form>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon name="shield" className="h-3.5 w-3.5" />
              The assistant can only do bookings for your signed-in account.
            </p>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
