CREATE TABLE "rfq_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"aws" text NOT NULL,
	"quantity" integer NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"email" text NOT NULL,
	"phone" text,
	"message" text,
	"source" text DEFAULT 'page' NOT NULL,
	"ip" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rfq_items_rfq_id_idx" ON "rfq_items" USING btree ("rfq_id");--> statement-breakpoint
CREATE INDEX "rfqs_email_idx" ON "rfqs" USING btree ("email");--> statement-breakpoint
CREATE INDEX "rfqs_created_at_idx" ON "rfqs" USING btree ("created_at");