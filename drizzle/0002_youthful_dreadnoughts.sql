ALTER TABLE "quotes" ADD COLUMN "pdf_token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "snapshot" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_pdf_token_unique" UNIQUE("pdf_token");