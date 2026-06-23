CREATE TYPE "public"."prompt_run_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
ALTER TYPE "public"."prompt_run_result_status" ADD VALUE 'pending' BEFORE 'success';--> statement-breakpoint
ALTER TYPE "public"."prompt_run_result_status" ADD VALUE 'running' BEFORE 'success';--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD COLUMN "status" "prompt_run_status" DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD COLUMN "completed_at" timestamp;