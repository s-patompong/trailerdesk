CREATE TABLE "email_deliveries" (
	"idempotency_key" text PRIMARY KEY NOT NULL,
	"dealership_id" text,
	"content_hash" text NOT NULL,
	"provider_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "email_deliveries" ADD CONSTRAINT "email_deliveries_dealership_id_organization_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;