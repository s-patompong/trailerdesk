CREATE TABLE "public_forms" (
	"id" text PRIMARY KEY NOT NULL,
	"dealership_id" text NOT NULL,
	"public_key" text NOT NULL,
	"name" text NOT NULL,
	"heading" text NOT NULL,
	"description" text NOT NULL,
	"submit_label" text DEFAULT 'Send inquiry' NOT NULL,
	"success_message" text DEFAULT 'Thanks! The dealership will be in touch.' NOT NULL,
	"allowed_origins" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_forms_public_key_unique" UNIQUE("public_key")
);
--> statement-breakpoint
ALTER TABLE "public_forms" ADD CONSTRAINT "public_forms_dealership_id_organization_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_forms_tenant_idx" ON "public_forms" USING btree ("dealership_id");