# AI Prompt Tracking Platform

A Next.js app for running prompt research across multiple OpenRouter models, tracking model responses, and measuring whether a target brand is mentioned or cited.

The main workflow is available after sign-in from `/dashboard/`. Prompt batching and research runs are handled there, with saved history and analytics available in the dashboard views.

## Tech Stack

- Next.js 16 with React 19
- TypeScript
- Drizzle ORM with PostgreSQL
- Better Auth for authentication
- OpenRouter for model access
- Nodemailer SMTP for OTP and password reset email
- Tailwind CSS and shadcn-style UI components

## Setup

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Fill in the required values in `.env`:

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

Run database migrations:

```bash
pnpm db:migrate
```

Start the development server:

```bash
pnpm dev
```

Open `http://localhost:3000`, sign in, and go to `/dashboard/`.

## Useful Scripts

```bash
pnpm dev          # Start local development
pnpm build        # Build for production
pnpm start        # Start the production build
pnpm lint         # Run ESLint
pnpm format       # Format files with Prettier
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Apply Drizzle migrations
pnpm db:studio    # Open Drizzle Studio
```

## How Prompt Runs Work

From `/dashboard/`, users can submit prompt research runs for a brand and optional brand domain. Each run:

1. Saves the prompt, brand, and domain to PostgreSQL.
2. Sends the prompt to the configured OpenRouter model set.
3. Stores each model response separately.
4. Evaluates whether the brand was mentioned, cited, and the response sentiment.
5. Makes the results available in dashboard analytics and prompt history.

The app currently compares an OpenAI-labelled model path and a Gemini-labelled model path. Both are configured through environment variables so the underlying OpenRouter model IDs can be changed without code changes.

## Decisions Made

- **OpenRouter as the model gateway:** The app uses OpenRouter so multiple model providers can be accessed through one integration and configured through environment variables.
- **Free model enforcement:** Prompt-run models are expected to use free OpenRouter model IDs. This keeps local testing and demos low-cost.
- **Gemini fallback model:** A free Gemini model is not currently available on OpenRouter, so the Gemini-labelled path uses `google/gemma-4-26b-a4b-it:free`.
- **PostgreSQL with Drizzle:** Prompt runs, model results, auth records, and analysis metadata are stored relationally, with migrations kept in the `migrations/` directory.
- **Better Auth:** Authentication is handled with Better Auth, including Google OAuth and email OTP flows.
- **Server-side prompt execution:** Prompt execution runs through API routes so OpenRouter keys and evaluator logic stay on the server.
- **Saved run history:** Prompt research results are persisted instead of being treated as one-off chat responses, making filtering, comparison, and dashboard summaries possible.

## Known Trade-offs

- **Gemini availability:** Gemini’s free OpenRouter option is unavailable, so `google/gemma-4-26b-a4b-it:free` is used as the closest free Google model option for now.
- **Free-model limits:** Free OpenRouter models can change availability, rate limits, latency, and quality over time. If a model stops working, update the corresponding `OPENROUTER_*_MODEL` value.
- **Provider labels vs model IDs:** The dashboard can present a provider comparison, but the exact model may differ from the provider family when a free fallback is required.
- **Evaluator dependence:** Mention, citation, and sentiment analysis depends on the configured evaluator model, so classification quality is tied to that model’s reliability.
- **External services required:** A working PostgreSQL database, OpenRouter key, OAuth credentials, and SMTP credentials are needed for the full app experience.
- **Batching scope:** Prompt batching is centered on the `/dashboard/` research workflow. It is optimized for tracked dashboard usage, not a standalone bulk-import API.
