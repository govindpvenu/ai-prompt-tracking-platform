# AI Prompt Tracking Platform

A small Next.js app for checking how AI models talk about a brand.

You enter a prompt, brand name, and optional website. The app sends the prompt through OpenRouter, saves each model response, and shows whether the brand was mentioned, cited, and how the response came across.

## What It Does

- Runs prompt research from the dashboard for a single brand.
- Compares an OpenAI-labelled path and a Gemini-labelled path through OpenRouter.
- Saves prompt history, model responses, mention checks, citation checks, and sentiment.
- Supports batch runs for up to five brands at a time.
- Supports daily or weekly scheduled prompts for ongoing tracking.
- Shows simple dashboard stats for runs, responses, mentions, and citations.

## Stack

- Next.js 16, React 19, TypeScript
- PostgreSQL with Drizzle
- Better Auth
- OpenRouter
- Tailwind CSS and shadcn-style components

## Setup

Install dependencies:

```bash
pnpm install
```

Create your env file:

```bash
cp .env.example .env
```

Fill in the main values:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000

BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-random-secret

DATABASE_URL=postgresql://...

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Your Name <yourname@gmail.com>

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=Prompt Tracker

OPENROUTER_OPENAI_MODEL=openai/gpt-oss-20b:free
OPENROUTER_GEMINI_MODEL=google/gemma-4-26b-a4b-it:free
```

Run migrations and start the app:

```bash
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`, sign in, and go to `/dashboard`.

## Useful Commands

```bash
pnpm dev          # local dev server
pnpm build        # production build
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm db:generate  # create Drizzle migrations
pnpm db:migrate   # run Drizzle migrations
pnpm db:studio    # open Drizzle Studio
```

## How A Run Works

1. The user submits a prompt with a brand and optional domain.
2. The server creates a saved run in PostgreSQL.
3. OpenRouter sends the prompt to the configured model paths.
4. Each response is stored separately.
5. The app checks for brand mentions, citations, and sentiment.
6. The results show up in dashboard analytics and history.

## Decisions

- **OpenRouter:** One API makes it easier to try different models without rewriting the model layer.
- **Drizzle and PostgreSQL:** The app is mostly saved research data, so a relational setup fits well.
- **Better Auth:** Auth is handled with Google sign-in, email flows, sessions, and account pages.
- **Server-side model calls:** API keys and analysis logic stay on the server.

## Known Trade-offs

- **Gemini fallback model:** A free Gemini model is not currently available on OpenRouter, so the Gemini-labelled path uses `google/gemma-4-26b-a4b-it:free`.
- **Free model limits:** Free OpenRouter models can be slower, rate-limited, or removed. If that happens, update the model env values.
- **Provider labels are not perfect:** The UI compares provider-labelled paths, but a free fallback can mean the exact model is from a related family.
- **Analysis quality depends on the evaluator:** Mention, citation, and sentiment checks are only as good as the configured evaluator model.
- **External services are required:** The full app needs PostgreSQL, OpenRouter, OAuth credentials, and SMTP.

## To Be Implemented

- **BYOK:** Let users bring their own OpenRouter key. I decided to add this because the hosted app should not have to carry everyone’s model usage cost, and users who already have keys should be able to control their own limits and billing.
