import { and, eq, isNull, sql, like, desc, asc, or } from 'drizzle-orm';
import { db } from './db.ts';
import * as schema from '../shared/schema.ts';
import { User, Vehicle, Garage, Appointment } from '@shared/schema.ts';
import type { IStorage } from './storage.ts';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';

const PostgresSessionStore = connectPgSimple(session);

// Initialize PostgreSQL connection pool for session store
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
    this.initializeGarages();
  }

  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return users[0];
  }

  async createUser(user: schema.InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values({
      ...user,
      isAdmin: user.isAdmin ?? false,
    }).returning();
    return result[0];
  }

  // Vehicle Operations
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const vehicles = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
    return vehicles[0];
  }

  async getVehiclesByUserId(userId: number): Promise<Vehicle[]> {
    return await db.select().from(schema.vehicles).where(eq(schema.vehicles.userId, userId));
  }

  async createVehicle(vehicle: schema.InsertVehicle): Promise<Vehicle> {
    // If this is marked as primary, set all other vehicles for this user to not primary
    if (vehicle.isPrimary) {
      await db.update(schema.vehicles)
        .set({ isPrimary: false })
        .where(eq(schema.vehicles.userId, vehicle.userId));
    }
    
    const result = await db.insert(schema.vehicles).values({
      ...vehicle,
      isPrimary: vehicle.isPrimary ?? false,
      nextServiceMileage: vehicle.nextServiceMileage ?? null,
    }).returning();
    
    return result[0];
  }

  async updateVehicle(id: number, updateData: Partial<schema.InsertVehicle>): Promise<Vehicle | undefined> {
    const vehicle = await this.getVehicle(id);
    if (!vehicle) return undefined;

    // If this is being set as primary, set all other vehicles for this user to not primary
    if (updateData.isPrimary) {
      await db.update(schema.vehicles)
        .set({ isPrimary: false })
        .where(and(
          eq(schema.vehicles.userId, vehicle.userId),
          sql`${schema.vehicles.id} != ${id}`
        ));
    }

    const result = await db.update(schema.vehicles)
      .set(updateData)
      .where(eq(schema.vehicles.id, id))
      .returning();
    
    return result[0];
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(schema.vehicles)
      .where(eq(schema.vehicles.id, id))
      .returning({ id: schema.vehicles.id });
    
    return result.length > 0;
  }

  // Garage Operations
  async getGarage(id: number): Promise<Garage | undefined> {
    const garages = await db.select().from(schema.garages).where(eq(schema.garages.id, id));
    return garages[0];
  }

  async getNearbyGarages(lat: number, lng: number, radius: number): Promise<Garage[]> {
    const allGarages = await db.select().from(schema.garages);
    
    return allGarages.filter(garage => {
      const distance = this.calculateDistance(lat, lng, garage.latitude, garage.longitude);
      return distance <= radius;
    });
  }

  async getAllGarages(): Promise<Garage[]> {
    return await db.select().from(schema.garages);
  }

  async getGaragesByService(service: string): Promise<Garage[]> {
    const allGarages = await db.select().from(schema.garages);
    return allGarages.filter(garage => 
      garage.services.some(s => s.toLowerCase().includes(service.toLowerCase()))
    );
  }

  // Appointment Operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const appointments = await db.select().from(schema.appointments).where(eq(schema.appointments.id, id));
    return appointments[0];
  }

  async getAppointmentsByUserId(userId: number): Promise<Appointment[]> {
    return await db.select().from(schema.appointments).where(eq(schema.appointments.userId, userId));
  }

  async createAppointment(appointment: schema.InsertAppointment): Promise<Appointment> {
    const result = await db.insert(schema.appointments).values({
      ...appointment,
      status: appointment.status || 'scheduled',
      price: appointment.price ?? null,
      notes: appointment.notes ?? null,
    }).returning();
    
    return result[0];
  }

  async updateAppointment(id: number, updateData: Partial<schema.InsertAppointment>): Promise<Appointment | undefined> {
    const result = await db.update(schema.appointments)
      .set(updateData)
      .where(eq(schema.appointments.id, id))
      .returning();
    
    return result[0];
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db.delete(schema.appointments)
      .where(eq(schema.appointments.id, id))
      .returning({ id: schema.appointments.id });
    
    return result.length > 0;
  }

  // Helper methods
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Initialize sample garages (only run once)
  private async initializeGarages() {
    const existingGarages = await db.select().from(schema.garages);
    if (existingGarages.length > 0) return;

    // Sample garages
    const sampleGarages = [
      {
        name: 'AutoFix Pro',
        address: '123 Main St, Paris, France',
        latitude: 48.864716,
        longitude: 2.349014,
        openingHour: 8,
        closingHour: 18,
        isOpen: true,
        phoneNumber: '+33 1 23 45 67 89',
        services: ['Oil Change', 'Brake Service', 'Engine Repair', 'Transmission', 'Electrical'],
        rating: 4.7,
        reviewCount: 253,
        isFavorite: false,
      },
      {
        name: 'MechanicMasters',
        address: '456 Oak Ave, Lyon, France',
        latitude: 45.764043,
        longitude: 4.835659,
        openingHour: 7,
        closingHour: 19,
        isOpen: true,
        phoneNumber: '+33 4 56 78 90 12',
        services: ['Tire Change', 'Diagnostics', 'AC Service', 'Body Work', 'Oil Change'],
        rating: 4.5,
        reviewCount: 187,
        isFavorite: false,
      },
      {
        name: 'QuickFix Garage',
        address: '789 Pine Rd, Marseille, France',
        latitude: 43.296482,
        longitude: 5.369780,
        openingHour: 9,
        closingHour: 17,
        isOpen: false,
        phoneNumber: '+33 6 78 90 12 34',
        services: ['Emergency Service', 'Towing', 'Battery Replacement', 'Glass Repair'],
        rating: 4.2,
        reviewCount: 98,
        isFavorite: false,
      }
    ];

    for (const garage of sampleGarages) {
      await db.insert(schema.garages).values(garage);
    }
  }
}