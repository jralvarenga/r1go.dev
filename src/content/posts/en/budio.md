---
title: "My Experience Building Budio: A Deep Dive into Convex with Next.js and Polar"
description: "A deep look at building Budio with Next.js, Convex, Better Auth and Polar, what worked, what didn’t, and why I’d use them again."
date: "2026-02-08"
links:
  - label: "Budio Website"
    url: "https://budio.r1go.dev"
  - label: "Convex"
    url: "https://www.convex.dev"
---

# My Experience Building My Own Budgeting App

I started building Budio around 3 months ago because I needed to start tracking my finances and monthly budget. Most expense trackers and budgeting planners were either overcomplicated or expensive, so I made the decision to build my own solution. At the same time, I'd been seeing a lot of attention and hype around Convex and Polar, people were saying these tools were game changers. Spoiler alert: they kind of are, at least for me. So I thought this would be the perfect opportunity to try them out in a real project.

Before we dive in, I want to be clear: I'm not trying to sell you on using Budio. This app is an experiment for myself to try new tools and fix a problem I have at the same time. What I want to share is my honest experience and opinion on these tools, the technical challenges I faced and how I solved them.

## Why Next.js (and Why Not Tanstack Start... Yet)

No particular reason for choosing Next.js initially, I've been using it for almost everything I build. It works for me and is the tool I use the most. The ecosystem is mature, the documentation is solid, and I can move fast with it.

Now, while I was building Budio, Tanstack Start was released, and I was genuinely excited about it. I tried it for a bit on the side, and it was actually great. There are so many things I really enjoyed about Tanstack Start. The fact that the router file system is fully typed is a game changer for me, no more string-based route references, no more runtime errors from typos in navigation. The type safety across the entire routing layer felt like what Next.js should have been doing all along, and I have to admit I was jealous missing out on all the features it has over Next.js.

But here's the reality: I still really enjoy working with Next.js, and I'm too lazy and busy to migrate the entire codebase to Tanstack Start. The app server components paradigm, the built-in optimizations, and the familiarity just won out for this project. I'll keep using Next.js for Budio for now but I loved Tanstack Start and I'll definitely use it in the future for another side project or experiment, or even migrate this app.

## Internationalization and Language Switcher: Vibe Coding FTW

For internationalization, I decided to try building my own solution. I followed the Next.js docs and just vibe code my way through the implementation. I wanted to see how far I could get without pulling in extra abstractions, and for now, the approach feels simple, clear, and does exactly what I need.

Here's my approach: I created a simple context provider that handles language switching, paired with a JSON structure for translations:

```typescript
// lib/i18n/provider.tsx
"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n/locales";

type Messages = Record<string, unknown>;

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (
      acc &&
      typeof acc === "object" &&
      part in (acc as Record<string, unknown>)
    ) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : `{${k}}`,
  );
}

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const t: I18nContextValue["t"] = (key, vars) => {
      const found = getByPath(messages, key);
      if (typeof found !== "string") return key;
      return interpolate(found, vars);
    };
    return { locale, messages, t };
  }, [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within <I18nProvider />");
  }
  return ctx;
}
```

I'm happy with the current workaround for now. Maybe in the future, as the app scales, it'll require something more sophisticated (like proper pluralization rules, ICU message format, etc.), but for the moment it's good enough and doesn't add unnecessary complexity.

## My Experience with Convex

Convex is great. I genuinely think it's a game changer tool for backend-as-a-service. Compared to similar services like Firebase or Supabase, it's not even close, Convex is king, and I'll probably use it for most of my projects from now on.

### Why Convex Over Firebase/Supabase

I was never a fan of Firebase and Supabase, where the whole database is essentially open and you rely heavily on security rules. I've used both, and when I do, the experience is like stepping on glass, one wrong move and everything breaks. Security rules are hard to test, hard to debug, and hard to reason about as your app grows.

Convex has a totally different approach that resonates with me:

**1. Function-Based API**: You create your own endpoints (queries, mutations, actions) explicitly. You open only what you want to open. It feels more like a traditional REST API but without the headaches of setting up Express, handling CORS, managing deployment, etc.

**2. Real-time by Default**: Every query is reactive. When data changes, your UI updates automatically. No need to set up subscriptions or manage WebSocket connections manually.

**3. TypeScript All the Way**: The code generation is fantastic. Your client-side code knows exactly what arguments your backend functions expect and what they return. It's type-safe end-to-end.

**4. Local Development**: The dev server is fast, and you can test everything locally before deploying. The dashboard is clean and actually useful for debugging.

I love the experience of working with Convex and can 100% recommend it to everyone building modern web apps.

## Convex + Better Auth: A Rocky Start, But Worth It

I love Better Auth and use it for everything I build on my side projects. It's flexible, open-source, and doesn't lock you into a specific provider. So I thought this would be a great opportunity to try out Convex + Better Auth integration.

### The Struggle (Pre-0.10)

After using it for a while, I have to be honest, it wasn't great initially. I was really frustrated with it. Auth wasn't persistent between sessions, sometimes requests didn't work as expected, and the integration felt broken. The main issue was around checking if a user was authenticated in Convex functions. The patterns suggested in the docs didn't work reliably, and I was getting inconsistent behavior.

I was *this close* to migrating over to Clerk because I'd had enough of fighting with the integration. Clerk would have been plug-and-play, but I really didn't want to give up on Better Auth.

### The Turnaround (Version 0.10)

Then version 0.10 was released, and man, all the problems went away. They introduced better ways to check if the user is authenticated, which was my main issue. Specifically, they added a more robust `auth.getUserIdentity()` pattern in Convex that works consistently:

```typescript
// Before (unreliable)
import { getTokenNextjs, createAuth } from "@repo/convex/server";
import { CreateAuth } from "@convex-dev/better-auth";
import type { DataModel } from "@repo/convex/generated/dataModel.js";

const getToken = () => {
  return getTokenNextjs(createAuth as CreateAuth<DataModel>);
};

const token = await getToken();

if (!token) {
  redirect("/auth/login");
}

// After 0.10 (reliable)
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});

const user = await isAuthenticated();
```

Everything started working as expected, and I was happy I didn't have to migrate. The session management became solid and the auth state synchronized properly between the client and Convex functions.

### My Recommendation

I can recommend the Convex + Better Auth combo, but with caution. My use of this integration isn't that deep, I'm handling basic email/password and Google OAuth and session management. I can't speak to more complicated functions like magic links, or advanced role-based access control. If you're doing something simple, it's great. If you need complex auth flows, do your research first or consider Clerk.

## Is Polar That Great?

Yes. I really enjoyed working with Polar. It's a modern payment and subscription platform that's actually designed for developers. The API is clean, the documentation is good, and it's easy to integrate into any framework.

### The Integration Experience

I went with the Better Auth integration, which hooks into the user authentication system seamlessly. The Polar SDK is straightforward:

### The Challenge: Webhooks in Convex

But I hit a snag with my specific stack. Polar's webhook integrations assume a Node.js runtime. In Convex, the Node.js environment is only available in actions, not in database configuration or schema files where tools like Better Auth and Polar are commonly initialized. This creates a mismatch.

The typical Polar webhook handler looks like this:

```typescript
// This pattern doesn't work directly in Convex
const auth = betterAuth({
    // ... Better Auth config
    plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                webhooks({
                    secret: process.env.POLAR_WEBHOOK_SECRET,
                    onCustomerStateChanged: (payload) => // Triggered when anything regarding a customer changes
                    onOrderPaid: (payload) => // Triggered when an order was paid (purchase, subscription renewal, etc.)
                    ...  // Over 25 granular webhook handlers
                    onPayload: (payload) => // Catch-all for all events
                })
            ],
        })
    ]
});
```

### My Solution

I created my own endpoints for Polar webhooks using Convex actions, which have access to the Node.js runtime:

```typescript
// convex/polar.ts
export const handlePolarWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Polar webhook: secret not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  try {
    const body = await request.text();

    // Get Standard Webhooks headers
    const webhookId = request.headers.get("webhook-id");
    const webhookTimestamp = request.headers.get("webhook-timestamp");
    const webhookSignature = request.headers.get("webhook-signature");

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.error("Polar webhook: missing required headers");
      return new Response("Missing required headers", { status: 400 });
    }

    // Standard Webhooks: message = "msg_id.timestamp.body"
    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;

    // Prepare the secret - try base64 decode first, fall back to raw string
    let secretBytes: Uint8Array;
    const textEncoder = new TextEncoder();
    const secretWithoutPrefix = secret.startsWith("whsec_")
      ? secret.slice(6)
      : secret;

    try {
      secretBytes = base64ToUint8Array(secretWithoutPrefix);
    } catch {
      secretBytes = textEncoder.encode(secretWithoutPrefix);
    }

    // Import the key for HMAC
    const keyBuffer = new ArrayBuffer(secretBytes.length);
    new Uint8Array(keyBuffer).set(secretBytes);
    const key = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // Compute the signature
    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedContent),
    );
    const computedSignature = uint8ArrayToBase64(
      new Uint8Array(signatureBuffer),
    );

    // Parse and verify provided signatures (format: "v1,sig1 v1,sig2")
    const providedSignatures = webhookSignature.split(" ");
    let isValid = false;

    for (const sig of providedSignatures) {
      if (sig.startsWith("v1,") && computedSignature === sig.substring(3)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      console.error("Polar webhook: signature verification failed");
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse and process the webhook
    const payload = JSON.parse(body);
    const eventType = payload.type;
    const data = payload.data;

    switch (eventType) {
      case "customer.created":
        // action here
        break;

      case "subscription.created":
      case "subscription.updated":
        // action here
        break;

      case "subscription.canceled":
      case "subscription.revoked":
        // action here
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Polar webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
```

Then I exposed this through Convex http config:

```typescript
// convex/http.ts
http.route({
  path: "/api/polar/webhooks",
  method: "POST",
  handler: handlePolarWebhook,
});
```

This solution works well for now, although I think it'll require refactoring later as webhook handling gets more complex. But for my current needs, it's solid.

## The Technical Stack Overview

Here's the full stack I ended up with:

- **Framework**: Next.js 16
- **Backend**: Convex
- **Authentication**: Better Auth
- **Payments**: Polar
- **Styling**: Tailwind CSS ,  shadcn/ui
- **Deployment**: Vercel (frontend), Convex Cloud (backend)

The separation of concerns is clean: Next.js handles the UI and routing, Convex handles all the data logic and real-time updates, Better Auth manages sessions, and Polar handles monetization.

## The End Product

I've been using Budio constantly for about a month now, and I'm really happy with it. I still need to tweak some things, and as of right now it's only web-based. At some point I'll work on a React Native app to test the integration with Convex and Better Auth on mobile, but for now the web app works perfectly for my needs.

### What Budio Does

It's a really simple app with focused features:

**1. Expense Tracking**: Add expenses with amount, description, category, and account. See them in a clean list view with filters.

**2. Recurring Transactions**: Set up recurring income and expenses (salary, rent, subscriptions). The app automatically projects these into future months.

**3. Account/Wallet Management**: Track multiple accounts (checking, savings, credit cards). See balances update in real-time as you add transactions.

**4. Category-Based Insights**: Organize expenses by category (food, transport, entertainment). Visual breakdown of spending patterns.

**5. Budget Planning**: Plan monthly budgets based on recurring transactions and historical data. Get alerts when you're close to budget limits.

### The Value Proposition

Does it work for me? Absolutely. I completely replaced my Excel spreadsheet for budget planning. The real-time updates, the simplicity, and the fact that I built it to solve my exact problem makes it perfect for my use case.

Of course, there are plenty of apps about finance, and even better ones that connect directly with your bank account (like Mint, YNAB, or Copilot). I'm not aiming for that level of complexity. I want something simpler to manually track my stuff. Plaid integration is also pretty expensive ($200+/month after the sandbox tier) and doesn't make sense for me at the moment for a personal project.

### The Killer Feature: Team Expense Tracking

I think one killer feature is the ability to track expenses with your team. This can be a family, a couple, or maybe your own work team. Multiple people can add transactions, and everyone sees the same real-time data. This is actually where the paid tier comes in on the app.

When someone in the team adds an expense, everyone sees it instantly thanks to Convex's real-time subscriptions. No polling, no refresh needed. This is huge for shared household budgets or small business expense tracking.

## What I Learned

Building Budio taught me a lot:

**1. Don't overengineer**: My simple i18n solution works better than a complex library would have for this use case.

**2. Convex is incredible**: Convex specifically changed how I think about building backends. The productivity gain is real.

**3. Payment webhooks need care**: The Node.js runtime requirement for webhook validation is a real consideration when choosing your backend.

**5. Build for yourself first**: Because I'm the primary user, I can iterate fast without worrying about edge cases that don't affect me yet.

## What's Next

There's still more to do:

- **Mobile app**: React Native with the same Convex backend
- **Export functionality**: CSV export for power users who want to analyze data elsewhere
- **Advanced budgeting**: Rollover budgets, savings goals, debt payoff tracking
- **Receipt scanning**: Use OCR to extract data from receipt images
- **Better analytics**: More detailed spending insights and trends

But I'm not rushing. The app works for my needs today, and I'll add features as I need them.

## Final Thoughts

If you're considering building a SaaS or tool and wondering about the stack:

- **Convex**: Absolutely try it. The DX is fantastic.
- **Better Auth**: Great if you want flexibility, but be patient with integration quirks.
- **Polar**: Excellent for subscriptions, just plan your webhook architecture carefully.
- **Next.js**: Still solid, but keep an eye on Tanstack Start for future projects.

Budio isn't going to replace your bank's app, and it's not trying to. It's a focused tool for people who want manual control over their budget tracking without the bloat. And building it taught me more about modern web development than any tutorial could.

If you want to check it out or see the code, hit me up. And if you have questions about Convex, Polar, or Better Auth, I'm happy to share more details about the implementation.

Thanks for reading:)
