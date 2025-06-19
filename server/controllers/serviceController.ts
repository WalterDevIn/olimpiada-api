import { Request, Response } from "express";
import { storage } from "../storage";
import { requireAdmin, requireAuth } from "../middleware/validation";

class ServiceController {
  // GET /api/services - Public access for browsing
  getServices = async (req: Request, res: Response) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  };

  // GET /api/services/:id - Public access
  getService = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }

      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  };

  // POST /api/services - Admin only
  createService = [requireAdmin, async (req: Request, res: Response) => {
    try {
      const service = await storage.createService(req.body);
      res.status(201).json(service);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ message: "Failed to create service" });
    }
  }];

  // PUT /api/services/:id - Admin only
  updateService = [requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }

      const service = await storage.updateService(id, req.body);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({ message: "Failed to update service" });
    }
  }];

  // DELETE /api/services/:id - Admin only
  deleteService = [requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }

      const deleted = await storage.deleteService(id);
      if (!deleted) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  }];
}

export const serviceController = new ServiceController();
