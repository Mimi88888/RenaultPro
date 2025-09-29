import {
  users, type User, type InsertUser,
  vehicles, type Vehicle, type InsertVehicle,
  garages, type Garage, type InsertGarage,
  appointments, type Appointment, type InsertAppointment,
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { DatabaseStorage } from "./database-storage.ts";

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehiclesByUserId(userId: number): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  getGarage(id: number): Promise<Garage | undefined>;
  getNearbyGarages(lat: number, lng: number, radius: number): Promise<Garage[]>;
  getAllGarages(): Promise<Garage[]>;
  getGaragesByService(service: string): Promise<Garage[]>;

  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByUserId(userId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private garages: Map<number, Garage>;
  private appointments: Map<number, Appointment>;
  private currentUserId: number;
  private currentVehicleId: number;
  private currentGarageId: number;
  private currentAppointmentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.garages = new Map();
    this.appointments = new Map();
    this.currentUserId = 1;
    this.currentVehicleId = 1;
    this.currentGarageId = 1;
    this.currentAppointmentId = 1;

    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    this.initializeGarages();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      isAdmin: insertUser.isAdmin ?? false,
      isTunisian: insertUser.isTunisian ?? false,
      documentNumber: insertUser.documentNumber ?? null,
      documentType: insertUser.documentType ?? "",
      phoneNumber: insertUser.phoneNumber ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  // Vehicle operations
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getVehiclesByUserId(userId: number): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(
      (vehicle) => vehicle.userId === userId
    );
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentVehicleId++;
    const vehicle: Vehicle = {
      ...insertVehicle,
      id,
      isPrimary: insertVehicle.isPrimary ?? false,
      isImported: insertVehicle.isImported ?? false,
      importCountry: insertVehicle.importCountry ?? null,
      nextServiceMileage: insertVehicle.nextServiceMileage ?? null,
      status: insertVehicle.status ?? "active",
      requiresOtpVerification: insertVehicle.requiresOtpVerification ?? null,
      otpVerified: insertVehicle.otpVerified ?? null,
      purchaseDate: insertVehicle.purchaseDate ?? null,
    };

    if (vehicle.isPrimary) {
      for (const existingVehicle of this.vehicles.values()) {
        if (
          existingVehicle.userId === vehicle.userId &&
          existingVehicle.isPrimary
        ) {
          existingVehicle.isPrimary = false;
          this.vehicles.set(existingVehicle.id, existingVehicle);
        }
      }
    }
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, updateData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;

    if (updateData.isPrimary) {
      for (const existingVehicle of this.vehicles.values()) {
        if (
          existingVehicle.userId === vehicle.userId &&
          existingVehicle.id !== id &&
          existingVehicle.isPrimary
        ) {
          existingVehicle.isPrimary = false;
          this.vehicles.set(existingVehicle.id, existingVehicle);
        }
      }
    }

    const updatedVehicle: Vehicle = {
      ...vehicle,
      ...updateData,
      isPrimary: updateData.isPrimary ?? vehicle.isPrimary ?? false,
      isImported: updateData.isImported ?? vehicle.isImported ?? false,
      importCountry: updateData.importCountry ?? vehicle.importCountry ?? null,

      nextServiceMileage: updateData.nextServiceMileage ?? vehicle.nextServiceMileage ?? null,
      status: updateData.status ?? vehicle.status ?? "active",
      purchaseDate: updateData.purchaseDate ?? vehicle.purchaseDate ?? null,
    };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  // Garage operations
  async getGarage(id: number): Promise<Garage | undefined> {
    return this.garages.get(id);
  }

  async getNearbyGarages(lat: number, lng: number, radius: number): Promise<Garage[]> {
    const garages = Array.from(this.garages.values());
    return garages.filter((garage) => {
      const distance = this.calculateDistance(
        lat, lng, garage.latitude, garage.longitude
      );
      return distance <= radius;
    });
  }

  async getAllGarages(): Promise<Garage[]> {
    return Array.from(this.garages.values());
  }

  async getGaragesByService(service: string): Promise<Garage[]> {
    return Array.from(this.garages.values()).filter((garage) =>
      garage.services.includes(service)
    );
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByUserId(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.userId === userId
    );
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      status: insertAppointment.status || "scheduled",
      price: insertAppointment.price ?? null,
      notes: insertAppointment.notes ?? null,
      paymentMethod: insertAppointment.paymentMethod ?? "unknown",
      paymentStatus: insertAppointment.paymentStatus ?? "pending",
      transactionId: insertAppointment.transactionId ?? null,
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, updateData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;

    const updatedAppointment: Appointment = {
      ...appointment,
      ...updateData,
      paymentMethod: updateData.paymentMethod ?? appointment.paymentMethod ?? "unknown",
      paymentStatus: updateData.paymentStatus ?? appointment.paymentStatus ?? "pending",
      transactionId: updateData.transactionId ?? appointment.transactionId ?? null,
    };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Helper functions
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d * 0.621371;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Initialize sample garages
  private initializeGarages() {
    const sampleGarages: InsertGarage[] = [
      {
        name: "Renault Service Tunis Centre",
        address: "Avenue Habib Bourguiba, Tunis",
        latitude: 36.8065,
        longitude: 10.1815,
        rating: 4.6,
        reviewCount: 124,
        openingHour: 8,
        closingHour: 17,
        isOpen: true,
        phoneNumber: "+216 71 000 000",
        services: ["maintenance", "oil-change", "diagnostics", "brakes"],
        isFavorite: false,
      },
      {
        name: "Renault Service Ariana Nord",
        address: "Rue de l'Aeroport, Ariana",
        latitude: 36.8665,
        longitude: 10.1647,
        rating: 4.4,
        reviewCount: 89,
        openingHour: 8,
        closingHour: 18,
        isOpen: true,
        phoneNumber: "+216 71 111 111",
        services: ["maintenance", "battery", "tires"],
        isFavorite: false,
      },
      {
        name: "Renault Service La Marsa",
        address: "Rue de la Corniche, La Marsa",
        latitude: 36.8789,
        longitude: 10.3239,
        rating: 4.7,
        reviewCount: 57,
        openingHour: 9,
        closingHour: 17,
        isOpen: false,
        phoneNumber: "+216 71 222 222",
        services: ["maintenance", "aircon", "suspension"],
        isFavorite: false,
      },
    ];
    for (const garage of sampleGarages) {
      this.createGarage(garage);
    }
  }

  private async createGarage(insertGarage: InsertGarage): Promise<Garage> {
    const id = this.currentGarageId++;
    const garage: Garage = {
      ...insertGarage,
      id,
      rating: insertGarage.rating ?? null,
      reviewCount: insertGarage.reviewCount ?? null,
      isFavorite: insertGarage.isFavorite ?? false,
      holidays: [],
      breakdownDates: [],
      fullyBookedDates: null,
    };
    this.garages.set(id, garage);
    return garage;
  }
}

// For now, we're using MemStorage
// Switch to Postgres-backed storage (Neon via Drizzle)
export const storage = new DatabaseStorage();
