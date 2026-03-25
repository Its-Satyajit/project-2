CREATE TABLE "analysis_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid,
	"event" text NOT NULL,
	"status" text NOT NULL,
	"phase" text,
	"message" text,
	"metadata" json,
	"duration_ms" integer,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_logs" ADD CONSTRAINT "analysis_logs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;