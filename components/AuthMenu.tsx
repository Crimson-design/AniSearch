"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

async function sendThankYouEmail(accessToken?: string): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const res = await fetch("/api/welcome", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function AuthMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) setOpen(false);
    });

    function openModal() {
      setMessage("");
      setOpen(true);
    }
    window.addEventListener("open-auth", openModal);

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("open-auth", openModal);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function logIn() {
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setPassword("");
    setToast("Thank you for logging in! Welcome back to AnimeSearch.");
    const sent = await sendThankYouEmail(data.session?.access_token);
    if (sent) {
      setToast("Thank you for logging in! A thank-you email is on its way to your inbox.");
    }
  }

  async function signUp() {
    setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    if (!data.session) {
      setMessage("Check your email to confirm your account, then log in.");
      return;
    }
    setPassword("");
    setToast("Thank you for joining AnimeSearch! You're logged in.");
    const sent = await sendThankYouEmail(data.session.access_token);
    if (sent) {
      setToast("Thank you for joining AnimeSearch! A thank-you email is on its way.");
    }
  }

  async function logOut() {
    await supabase.auth.signOut();
  }

  const toastEl = toast ? (
    <div className="toast" role="status">
      {toast}
    </div>
  ) : null;

  if (user) {
    return (
      <>
        <div className="topbar-right">
          <a href="/my-reviews" className="nav-link">
            My Reviews
          </a>
          <a href="/watch-later" className="nav-link">
            Watch Later
          </a>
          <button className="btn btn-logout" onClick={logOut}>
            Log out
          </button>
        </div>
        {toastEl}
      </>
    );
  }

  return (
    <>
      <div className="topbar-right">
        <button
          className="btn"
          onClick={() => {
            setMessage("");
            setOpen(true);
          }}
        >
          Log in
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            setMessage("");
            setOpen(true);
          }}
        >
          Sign up
        </button>

        {open && (
          <div className="modal-overlay" onClick={() => setOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
              <p className="rating-heading">Welcome to AnimeSearch</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  logIn();
                }}
              >
                <input
                  className="field"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="field"
                  type="password"
                  placeholder="Password (6+ characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="btn-row">
                  <button type="submit" className="btn btn-primary">
                    Log in
                  </button>
                  <button type="button" className="btn" onClick={signUp}>
                    Sign up
                  </button>
                </div>
              </form>
              {message && <p className="message message-error">{message}</p>}
            </div>
          </div>
        )}
      </div>
      {toastEl}
    </>
  );
}