import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  // Nouveaux champs pour l'inscription
  isTunisian: boolean("is_tunisian").default(true).notNull(),
  documentNumber: text("document_number"), // CIN pour tunisien ou numéro de passeport pour étranger
  documentType: text("document_type").default("CIN").notNull(), // "CIN" ou "Passport"
  phoneNumber: text("phone_number"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  isAdmin: true,
  isTunisian: true,
  documentNumber: true,
  documentType: true,
  phoneNumber: true,
});

// Define the Vehicle model
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  licensePlate: text("license_plate").notNull(),
  vin: text("vin").notNull(),
  chipsetCode: text("chipset_code").notNull(),
  fuelType: text("fuel_type").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  status: text("status").notNull(),
  nextServiceMileage: integer("next_service_mileage"),
  // Nouveaux champs pour véhicules importés
  isImported: boolean("is_imported").default(false).notNull(),
  importCountry: text("import_country"),
  requiresOtpVerification: boolean("requires_otp_verification").default(false),
  otpVerified: boolean("otp_verified").default(false),
  purchaseDate: timestamp("purchase_date"),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  userId: true,
  make: true,
  model: true,
  year: true,
  licensePlate: true,
  vin: true,
  chipsetCode: true,
  fuelType: true,
  isPrimary: true,
  status: true,
  nextServiceMileage: true,
  isImported: true,
  importCountry: true,
  requiresOtpVerification: true,
  otpVerified: true,
  purchaseDate: true,
});

// Define the Garage model
export const garages = pgTable("garages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  rating: doublePrecision("rating"),
  reviewCount: integer("review_count"),
  openingHour: integer("opening_hour").notNull(),
  closingHour: integer("closing_hour").notNull(),
  isOpen: boolean("is_open").notNull(),
  phoneNumber: text("phone_number").notNull(),
  services: text("services").array().notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  holidays: timestamp("holidays").array(),
  breakdownDates: timestamp("breakdown_dates").array(),
  fullyBookedDates: timestamp("fully_booked_dates").array(),
});

export const insertGarageSchema = createInsertSchema(garages).pick({
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  rating: true,
  reviewCount: true,
  openingHour: true,
  closingHour: true,
  isOpen: true,
  phoneNumber: true,
  services: true,
  isFavorite: true,
});

// Define the Appointment model
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade", onUpdate: "cascade" }),
  garageId: integer("garage_id").notNull().references(() => garages.id, { onDelete: "cascade", onUpdate: "cascade" }),
  serviceType: text("service_type").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").default("scheduled").notNull(),
  price: doublePrecision("price"),
  notes: text("notes"),
  paymentMethod: text("payment_method").default("cash").notNull(), // cash, card, transfer, later
  paymentStatus: text("payment_status").default("pending").notNull(), // pending, completed, failed
  transactionId: text("transaction_id"),
});

export const insertAppointmentSchema = createInsertSchema(appointments, {
  date: z.preprocess(
    // Cette étape de prétraitement permet de convertir une chaîne en Date avant la validation
    (arg) => {
      if (arg instanceof Date) return arg;
      if (typeof arg === 'string') return new Date(arg);
      return arg;
    }, 
    z.date()
  )
}).pick({
    userId: true,
    vehicleId: true,
    garageId: true,
    serviceType: true,
    date: true,
    status: true,
    price: true,
    notes: true,
    paymentMethod: true,
    paymentStatus: true,
    transactionId: true,
  });

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertGarage = z.infer<typeof insertGarageSchema>;
export type Garage = typeof garages.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
