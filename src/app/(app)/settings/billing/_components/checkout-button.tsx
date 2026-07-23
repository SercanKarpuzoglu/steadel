"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: {
        open: (opts: {
          items: Array<{ priceId: string; quantity: number }>;
          customData?: Record<string, string>;
          customer?: { email?: string };
        }) => void;
      };
    };
  }
}

let paddleLoaded = false;

export function CheckoutButton({
  priceId,
  orgId,
  email,
  clientToken,
  sandbox,
  label,
}: {
  priceId: string;
  orgId: string;
  email: string;
  clientToken: string;
  sandbox: boolean;
  label: string;
}) {
  const [ready, setReady] = useState(paddleLoaded);

  useEffect(() => {
    if (paddleLoaded) return;
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      if (sandbox) window.Paddle?.Environment.set("sandbox");
      window.Paddle?.Initialize({ token: clientToken });
      paddleLoaded = true;
      setReady(true);
    };
    document.head.appendChild(script);
  }, [clientToken, sandbox]);

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() =>
        window.Paddle?.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customData: { orgId },
          customer: { email },
        })
      }
      className="h-10 w-full cursor-pointer rounded-md bg-amber px-4 text-sm font-medium text-paper transition hover:bg-amber-dark disabled:opacity-50"
    >
      {ready ? label : "Loading checkout…"}
    </button>
  );
}
