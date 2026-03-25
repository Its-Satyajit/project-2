ALTER TABLE "files" ADD COLUMN "parsed_imports" json;--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "content";