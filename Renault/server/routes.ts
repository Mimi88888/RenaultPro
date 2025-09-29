import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.ts";
import { setupAuth } from "./auth.ts";
import { insertVehicleSchema, insertAppointmentSchema } from "../shared/schema.ts";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get all vehicles for a user
  app.get("/api/vehicles", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = (req.user as Express.User).id;
    const vehicles = await storage.getVehiclesByUserId(userId);
    res.json(vehicles);
  });

  // Create a new vehicle
  app.post("/api/vehicles", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as Express.User).id;
      const validatedData = insertVehicleSchema.parse({
        ...req.body,
        userId
      });
      
      const vehicle = await storage.createVehicle(validatedData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  // Update a vehicle
  app.patch("/api/vehicles/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const vehicleId = parseInt(req.params.id);
    const userId = (req.user as Express.User).id;
    
    // Verify ownership
    const vehicle = await storage.getVehicle(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    if (vehicle.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      const updatedVehicle = await storage.updateVehicle(vehicleId, req.body);
      res.json(updatedVehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  // Delete a vehicle
  app.delete("/api/vehicles/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const vehicleId = parseInt(req.params.id);
    const userId = (req.user as Express.User).id;
    
    // Verify ownership
    const vehicle = await storage.getVehicle(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    if (vehicle.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const success = await storage.deleteVehicle(vehicleId);
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Get all garages
  app.get("/api/garages", async (req, res) => {
    const garages = await storage.getAllGarages();
    res.json(garages);
  });

  // Get nearby garages
  app.get("/api/garages/nearby", async (req, res) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 10; // default 10 miles
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }
    
    const garages = await storage.getNearbyGarages(lat, lng, radius);
    res.json(garages);
  });

  // Get garages by service
  app.get("/api/garages/service/:service", async (req, res) => {
    const service = req.params.service;
    const garages = await storage.getGaragesByService(service);
    res.json(garages);
  });

  // Get user appointments
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = (req.user as Express.User).id;
    const appointments = await storage.getAppointmentsByUserId(userId);
    res.json(appointments);
  });

  // Create a new appointment
  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as Express.User).id;
      const validatedData = insertAppointmentSchema.parse({
        ...req.body,
        userId
      });
      
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Update an appointment
  app.patch("/api/appointments/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const appointmentId = parseInt(req.params.id);
    const userId = (req.user as Express.User).id;
    
    // Verify ownership
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    if (appointment.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      const updatedAppointment = await storage.updateAppointment(appointmentId, req.body);
      res.json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Cancel/delete an appointment
  app.delete("/api/appointments/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const appointmentId = parseInt(req.params.id);
    const userId = (req.user as Express.User).id;
    
    // Verify ownership
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    if (appointment.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const success = await storage.deleteAppointment(appointmentId);
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
