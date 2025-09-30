CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"garage_id" integer NOT NULL,
	"service_type" text NOT NULL,
	"date" timestamp NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"price" double precision,
	"notes" text,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"transaction_id" text
);
--> statement-breakpoint
CREATE TABLE "garages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"rating" double precision,
	"review_count" integer,
	"opening_hour" integer NOT NULL,
	"closing_hour" integer NOT NULL,
	"is_open" boolean NOT NULL,
	"phone_number" text NOT NULL,
	"services" text[] NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"holidays" timestamp[],
	"breakdown_dates" timestamp[],
	"fully_booked_dates" timestamp[]
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_tunisian" boolean DEFAULT true NOT NULL,
	"document_number" text,
	"document_type" text DEFAULT 'CIN' NOT NULL,
	"phone_number" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"license_plate" text NOT NULL,
	"vin" text NOT NULL,
	"chipset_code" text NOT NULL,
	"fuel_type" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"status" text NOT NULL,
	"next_service_mileage" integer,
	"is_imported" boolean DEFAULT false NOT NULL,
	"import_country" text,
	"requires_otp_verification" boolean DEFAULT false,
	"otp_verified" boolean DEFAULT false,
	"purchase_date" timestamp
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;