CREATE TYPE "public"."model_provider" AS ENUM('openai', 'gemini');--> statement-breakpoint
CREATE TYPE "public"."prompt_run_result_status" AS ENUM('success', 'error');--> statement-breakpoint
CREATE TYPE "public"."mention_sentiment" AS ENUM('positive', 'neutral', 'negative', 'unknown');--> statement-breakpoint
CREATE TABLE "prompt_run_results" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"user_id" text NOT NULL,
	"model_provider" "model_provider" NOT NULL,
	"model_id" text NOT NULL,
	"status" "prompt_run_result_status" NOT NULL,
	"raw_response" text DEFAULT '' NOT NULL,
	"error_message" text,
	"brand_mentioned" boolean DEFAULT false NOT NULL,
	"brand_cited" boolean DEFAULT false NOT NULL,
	"sentiment" "mention_sentiment" DEFAULT 'unknown' NOT NULL,
	"mention_highlights" jsonb DEFAULT '[]'::jsonb,
	"citation_evidence" jsonb DEFAULT '[]'::jsonb,
	"usage_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"prompt" text NOT NULL,
	"brand" text NOT NULL,
	"brand_domain" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompt_run_results" ADD CONSTRAINT "prompt_run_results_run_id_prompt_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."prompt_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_run_results" ADD CONSTRAINT "prompt_run_results_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prompt_run_results_run_idx" ON "prompt_run_results" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "prompt_run_results_user_model_idx" ON "prompt_run_results" USING btree ("user_id","model_provider");--> statement-breakpoint
CREATE INDEX "prompt_run_results_user_mentioned_idx" ON "prompt_run_results" USING btree ("user_id","brand_mentioned");--> statement-breakpoint
CREATE INDEX "prompt_runs_user_created_idx" ON "prompt_runs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "prompt_runs_brand_idx" ON "prompt_runs" USING btree ("brand");