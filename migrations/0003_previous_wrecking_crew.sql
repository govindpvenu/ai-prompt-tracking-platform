CREATE TYPE "public"."prompt_schedule_cadence" AS ENUM('daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."prompt_schedule_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TABLE "prompt_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"prompt" text NOT NULL,
	"brand" text NOT NULL,
	"brand_domain" text,
	"cadence" "prompt_schedule_cadence" NOT NULL,
	"status" "prompt_schedule_status" DEFAULT 'active' NOT NULL,
	"next_run_at" timestamp NOT NULL,
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD COLUMN "schedule_id" text;--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "prompt_schedules" ADD CONSTRAINT "prompt_schedules_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prompt_schedules_user_status_next_idx" ON "prompt_schedules" USING btree ("user_id","status","next_run_at");--> statement-breakpoint
CREATE INDEX "prompt_schedules_user_created_idx" ON "prompt_schedules" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_schedule_id_prompt_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."prompt_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prompt_runs_schedule_created_idx" ON "prompt_runs" USING btree ("schedule_id","created_at");