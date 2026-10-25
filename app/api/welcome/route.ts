import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Confirm the login token is real and find out whose it is
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  const { data, error } = await supabase.auth.getUser(token);
  const email = data.user?.email;
  if (error || !email) {
    return NextResponse.json({ error: "Invalid login" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is missing from .env.local");
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:28px;background:#141519;color:#ffffff;border-radius:8px">
      <h1 style="color:#f47521;margin:0 0 12px">Thanks for logging in!</h1>
      <p style="line-height:1.6;color:#d4d4d8">
        Welcome back to AnimeSearch. Rate what you've watched, write reviews,
        and save anime to your Watch Later list.
      </p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "AnimeSearch <onboarding@resend.dev>",
      to: [email],
      subject: "Thanks for logging in to AnimeSearch",
      html,
      text: "Thanks for logging in to AnimeSearch! Welcome back.",
    }),
  });

  if (!res.ok) {
    console.error("Resend error:", await res.text());
    return NextResponse.json({ error: "Email failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}