CREATE TABLE "user_openrouter_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"encrypted_api_key" text,
	"openai_model" text DEFAULT 'openai/gpt-oss-20b:free' NOT NULL,
	"gemini_model" text DEFAULT 'google/gemma-4-26b-a4b-it:free' NOT NULL,
	"evaluator_model" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_openrouter_settings" ADD CONSTRAINT "user_openrouter_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_openrouter_settings_updated_idx" ON "user_openrouter_settings" USING btree ("updated_at");