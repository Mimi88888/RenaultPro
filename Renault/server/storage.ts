import { users, type User, type InsertUser, vehicles, type Vehicle, type InsertVehicle, garages, type Garage, type InsertGarage, appointments, type Appointment, type InsertAppointment } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
// Import types will be imported through dynamic import

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vehicle operations
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehiclesByUserId(userId: number): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // Garage operations
  getGarage(id: number): Promise<Garage | undefined>;
  getNearbyGarages(lat: number, lng: number, radius: number): Promise<Garage[]>;
  getAllGarages(): Promise<Garage[]>;
  getGaragesByService(service: string): Promise<Garage[]>;
  
  // Appointment operations
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByUserId(userId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Session store
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
    
    // Initialize memory store for sessions
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with sample garages for development
    this.initializeGarages();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false 
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
      (vehicle) => vehicle.userId === userId,
    );
  }
  
  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentVehicleId++;
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id,
      isPrimary: insertVehicle.isPrimary ?? false,
      nextServiceMileage: insertVehicle.nextServiceMileage ?? null 
    };
    
    // If this is marked as primary, update all other user vehicles to non-primary
    if (vehicle.isPrimary) {
      for (const existingVehicle of this.vehicles.values()) {
        if (existingVehicle.userId === vehicle.userId && existingVehicle.isPrimary) {
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
    
    // If setting as primary, update all other vehicles
    if (updateData.isPrimary) {
      for (const existingVehicle of this.vehicles.values()) {
        if (existingVehicle.userId === vehicle.userId && existingVehicle.id !== id && existingVehicle.isPrimary) {
          existingVehicle.isPrimary = false;
          this.vehicles.set(existingVehicle.id, existingVehicle);
        }
      }
    }
    
    const updatedVehicle = { ...vehicle, ...updateData };
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
    // Calculate distance using Haversine formula and filter by radius
    const garages = Array.from(this.garages.values());
    return garages.filter(garage => {
      const distance = this.calculateDistance(lat, lng, garage.latitude, garage.longitude);
      return distance <= radius;
    });
  }
  
  async getAllGarages(): Promise<Garage[]> {
    return Array.from(this.garages.values());
  }
  
  async getGaragesByService(service: string): Promise<Garage[]> {
    return Array.from(this.garages.values()).filter(
      (garage) => garage.services.includes(service),
    );
  }
  
  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async getAppointmentsByUserId(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.userId === userId,
    );
  }
  
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const appointment: Appointment = { 
      ...insertAppointment, 
      id,
      status: insertAppointment.status || 'scheduled',
      price: insertAppointment.price ?? null,
      notes: insertAppointment.notes ?? null 
    };
    this.appointments.set(id, appointment);
    return appointment;
  }
  
  async updateAppointment(id: number, updateData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...updateData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }
  
  // Helper functions
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d * 0.621371; // Convert to miles
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  // Initialize sample garages
  private initializeGarages() {
    const sampleGarages: InsertGarage[] = [
      // Tunisia Renault Garages
      {
        name: "Renault Tunis City",
        address: "Avenue Habib Bourguiba, Tunis",
        latitude: 36.806496,
        longitude: 10.181532,
        rating: 4.8,
        reviewCount: 142,
        openingHour: 8,
        closingHour: 18,
        isOpen: true,
        phoneNumber: "+216 71 234 567",
        services: ["Oil Change", "Brakes", "Diagnostics", "Electric Vehicles", "Renault Factory Parts"],
        isFavorite: false
      },
      {
        name: "Renault Sfax",
        address: "Route de Gabes, Sfax",
        latitude: 34.739090,
        longitude: 10.760144,
        rating: 4.6,
        reviewCount: 98,
        openingHour: 9,
        closingHour: 20,
        isOpen: true,
        phoneNumber: "+216 74 123 456",
        services: ["Tire Replacement", "Alignment", "Oil Change", "Renault Factory Parts"],
        isFavorite: false
      },
      {
        name: "Renault Sousse",
        address: "Avenue 14 Janvier, Sousse",
        latitude: 35.825603,
        longitude: 10.608394,
        rating: 4.9,
        reviewCount: 215,
        openingHour: 7,
        closingHour: 19,
        isOpen: true,
        phoneNumber: "+216 73 456 789",
        services: ["Full Service", "Engine Repair", "Renault Performance Tuning"],
        isFavorite: false
      },
      {
        name: "Maison Renault Hammamet",
        address: "Avenue de la République, Hammamet",
        latitude: 36.400429,
        longitude: 10.583290,
        rating: 4.7,
        reviewCount: 186,
        openingHour: 8,
        closingHour: 18,
        isOpen: true,
        phoneNumber: "+216 72 234 567",
        services: ["Luxury Cars", "Performance Tuning", "Detailing", "Renault Dacia Service"],
        isFavorite: false
      },
      {
        name: "Maison Renault Bizerte",
        address: "Rue Habib Bourguiba, Bizerte",
        latitude: 37.274423,
        longitude: 9.873845,
        rating: 4.5,
        reviewCount: 132,
        openingHour: 7,
        closingHour: 19,
        isOpen: true,
        phoneNumber: "+216 72 444 555",
        services: ["Off-Road Vehicles", "Tire Service", "A/C Repair", "Renault Factory Parts"],
        isFavorite: false
      },
      
      // International Renault Garages
      {
        name: "Maison Renault Paris",
        address: "75 Avenue des Champs-Élysées, Paris",
        latitude: 48.870474,
        longitude: 2.307975,
        rating: 4.8,
        reviewCount: 224,
        openingHour: 8,
        closingHour: 20,
        isOpen: true,
        phoneNumber: "+33 1 76 84 04 04",
        services: ["Full Service", "Renault Factory Parts", "Electric Vehicles"],
        isFavorite: false
      },
      {
        name: "Renault Madrid",
        address: "Calle de Alcalá, Madrid",
        latitude: 40.416775,
        longitude: -3.703790,
        rating: 4.6,
        reviewCount: 187,
        openingHour: 9,
        closingHour: 19,
        isOpen: true,
        phoneNumber: "+34 915 231 234",
        services: ["Renault Factory Parts", "Engine Repair", "Diagnostics"],
        isFavorite: false
      },
      {
        name: "Renault Istanbul",
        address: "Taksim Square, Istanbul",
        latitude: 41.008240,
        longitude: 28.978359,
        rating: 4.7,
        reviewCount: 156,
        openingHour: 8,
        closingHour: 18,
        isOpen: true,
        phoneNumber: "+90 212 345 67 89",
        services: ["Oil Change", "Brakes", "Renault Factory Parts"],
        isFavorite: false
      },
      {
        name: "Renault Casablanca",
        address: "Boulevard Mohammed V, Casablanca",
        latitude: 33.573110,
        longitude: -7.589843,
        rating: 4.5,
        reviewCount: 143,
        openingHour: 8,
        closingHour: 19,
        isOpen: true,
        phoneNumber: "+212 522 31 32 33",
        services: ["Renault Factory Parts", "Tire Service", "A/C Repair"],
        isFavorite: false
      },
      {
        name: "Renault Algiers",
        address: "Rue Didouche Mourad, Algiers",
        latitude: 36.753768,
        longitude: 3.057635,
        rating: 4.4,
        reviewCount: 165,
        openingHour: 8,
        closingHour: 18,
        isOpen: true,
        phoneNumber: "+213 21 23 45 67",
        services: ["Engine Repair", "Oil Change", "Renault Factory Parts"],
        isFavorite: false
      }
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
      isFavorite: insertGarage.isFavorite ?? false
    };
    this.garages.set(id, garage);
    return garage;
  }
}

// Choose which storage implementation to use
// For simplicity, we're using MemStorage for now
// We'll replace with DatabaseStorage in a future iteration

export const storage = new MemStorage();
