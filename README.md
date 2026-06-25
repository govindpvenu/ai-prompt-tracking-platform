# GetCited

An open-source, BYOK-first platform for checking how AI models talk about your
brand.

You enter a prompt, brand name, and optional website. GetCited sends the prompt
through OpenRouter, saves each model response, and shows whether the brand was
mentioned, cited, and how the response came across.

The project is designed to be inspected, self-hosted, and adapted. Teams can run
it with a shared environment OpenRouter key or let each user bring their own
OpenRouter key so model usage, billing, and limits stay under their control.

## What It Does

- Runs prompt research from the dashboard for a single brand.
- Compares an OpenAI-labelled path and a Gemini-labelled path through OpenRouter.
- Saves prompt history, model responses, mention checks, citation checks, and sentiment.
- Supports batch runs for up to five brands at a time.
- Supports daily or weekly scheduled prompts for ongoing tracking.
- Shows simple dashboard stats for runs, responses, mentions, and citations.
- Lets users bring their own OpenRouter API key, with saved keys encrypted before storage.
- Keeps the code open so the workflow can be self-hosted, audited, and extended.

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
BYOK_ENCRYPTION_KEY=replace-with-a-random-secret

OPENROUTER_OPENAI_MODEL=openai/gpt-oss-20b:free
OPENROUTER_GEMINI_MODEL=google/gemma-4-26b-a4b-it:free
OPENROUTER_EVALUATOR_MODEL=openai/gpt-oss-20b:free
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

- **Open source:** The project is meant to be self-hostable and easy to inspect, so teams can see how prompts, model calls, and scoring work.
- **BYOK-first model access:** Users can provide their own OpenRouter key from the dashboard, while deployments can still provide an environment fallback key.
- **OpenRouter:** One API makes it easier to try different models without rewriting the model layer.
- **Drizzle and PostgreSQL:** The app is mostly saved research data, so a relational setup fits well.
- **Better Auth:** Auth is handled with Google sign-in, email flows, sessions, and account pages.
- **Server-side model calls:** API keys and analysis logic stay on the server, and user-provided keys are encrypted before being saved.

## Known Trade-offs

- **Gemini fallback model:** A free Gemini model is not currently available on OpenRouter, so the Gemini-labelled path uses `google/gemma-4-26b-a4b-it:free`.
- **Free model limits:** Free OpenRouter models can be slower, rate-limited, or removed. If that happens, update the model env values.
- **Provider labels are not perfect:** The UI compares provider-labelled paths, but a free fallback can mean the exact model is from a related family.
- **Analysis quality depends on the evaluator:** Mention, citation, and sentiment checks are only as good as the configured evaluator model.
- **External services are required:** The full app needs PostgreSQL, OpenRouter, OAuth credentials, and SMTP.
