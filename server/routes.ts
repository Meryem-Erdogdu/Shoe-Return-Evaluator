import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { analyzeShoeImage } from "./services/ai";
import { insertShoeAnalysisSchema } from "@shared/schema";

// Rate limiting
const analyzeLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: "Too many analysis requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
});

// Enhanced file upload with security checks
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Reduced to 5MB limit
    files: 1, // Only 1 file at a time
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
    
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid file extension.'));
    }
    
    // Additional security: check for malicious filenames
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      return cb(new Error('Invalid filename.'));
    }
    
    cb(null, true);
  }
});

// Input validation helper
function validateId(id: string): boolean {
  return /^[a-fA-F0-9-]{36}$/.test(id); // UUID format
}

function sanitizeString(input: string): string {
  return input
    .replace(/[<>"'&]/g, '') // Remove HTML/script injection chars
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/\0/g, '') // Remove null bytes
    .trim()
    .slice(0, 1000);
}

function validateFileBuffer(buffer: Buffer): boolean {
  // Check for common file signature validation
  const jpegSignature = buffer.subarray(0, 2);
  const pngSignature = buffer.subarray(0, 8);
  const webpSignature = buffer.subarray(0, 4);
  
  const isJpeg = jpegSignature[0] === 0xFF && jpegSignature[1] === 0xD8;
  const isPng = pngSignature.equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
  const isWebp = webpSignature.equals(Buffer.from('RIFF', 'ascii'));
  
  return isJpeg || isPng || isWebp;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: process.env.NODE_ENV === 'production' 
          ? ["'self'"] 
          : ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http://localhost:*", "http://0.0.0.0:*"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "http://0.0.0.0:*"],
        fontSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    hsts: process.env.NODE_ENV === 'production' ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    } : false,
    noSniff: true,
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' }
  }));
  
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://flo-ai.replit.app']) 
      : ['http://localhost:5173', 'http://0.0.0.0:5000', 'https://0.0.0.0:5000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  
  // Apply general rate limiting to all API routes
  app.use('/api', generalLimit);
  
  // Upload and analyze shoe image
  app.post("/api/analyze-shoe", analyzeLimit, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      console.log(`Analyzing image: ${req.file.originalname}, size: ${req.file.size} bytes`);

      // Validate and sanitize customer notes
      const userNotes = req.body.customerNotes 
        ? sanitizeString(req.body.customerNotes) 
        : '';
      
      if (userNotes.length > 500) {
        return res.status(400).json({ error: "Customer notes too long. Maximum 500 characters allowed." });
      }
      
      // Enhanced file validation
      if (!req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({ error: "Invalid or empty image file." });
      }
      
      // Validate file signature
      if (!validateFileBuffer(req.file.buffer)) {
        return res.status(400).json({ error: "Invalid file format or corrupted image." });
      }
      
      // Prevent zip bomb attacks
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "File size too large." });
      }
      
      // Analyze image with AI
      const analysisResult = await analyzeShoeImage(req.file.buffer, userNotes);

      // Save to database
      const shoeAnalysis = await storage.createShoeAnalysis({
        userId: null, // TODO: Add user authentication
        imageUrl: `/uploads/${req.file.filename || 'temp'}`, // TODO: Implement proper file storage
        originalFilename: req.file.originalname,
        classification: analysisResult.classification,
        confidence: analysisResult.confidence,
        scores: analysisResult.scores,
        features: analysisResult.features,
        reasoning: analysisResult.reasoning,
        damageReasons: analysisResult.damageReasons,
        shoeModel: analysisResult.shoeModel,
        warrantyPeriod: analysisResult.warrantyPeriod,
        userNotes: userNotes || null,
        isUserError: analysisResult.isUserError ? 1 : 0,
        userErrorReason: analysisResult.userErrorReason || null,
        isApproved: 0,
      });

      res.json({
        id: shoeAnalysis.id,
        ...analysisResult,
        createdAt: shoeAnalysis.createdAt,
      });

    } catch (error) {
      console.error('Error analyzing shoe:', error);
      // Don't expose internal error details in production
      const errorMessage = process.env.NODE_ENV === 'production' 
        ? "Failed to analyze shoe image" 
        : (error instanceof Error ? error.message : "Failed to analyze shoe image");
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get recent analyses
  app.get("/api/recent-analyses", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 records
      const analyses = await storage.getRecentShoeAnalyses(limit);
      res.json(analyses);
    } catch (error) {
      console.error('Error fetching recent analyses:', error);
      res.status(500).json({ error: "Failed to fetch recent analyses" });
    }
  });

  // Get daily statistics
  app.get("/api/daily-stats", async (req, res) => {
    try {
      // Validate date input
      const dateParam = req.query.date as string;
      const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) 
        ? new Date(dateParam + 'T00:00:00.000Z')
        : new Date();
      const stats = await storage.getDailyStats(date);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      res.status(500).json({ error: "Failed to fetch daily statistics" });
    }
  });

  // Approve analysis result
  app.post("/api/approve-analysis/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { manualOverride } = req.body;
      
      if (!validateId(id)) {
        return res.status(400).json({ error: "Invalid ID format." });
      }
      
      // Validate manualOverride input if provided
      const validOverrides = ['returnable', 'not_returnable', 'send_back', 'donation', 'disposal'];
      if (manualOverride && !validOverrides.includes(manualOverride)) {
        return res.status(400).json({ error: "Invalid override value." });
      }

      await storage.approveShoeAnalysis(id, manualOverride || null);
      res.json({ success: true });
    } catch (error) {
      console.error('Error approving analysis:', error);
      res.status(500).json({ error: "Failed to approve analysis" });
    }
  });

  // Manual edit analysis result
  app.post("/api/manual-edit/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { manualOverride, userNotes } = req.body;
      
      if (!validateId(id)) {
        return res.status(400).json({ error: "Invalid ID format." });
      }
      
      // Validate inputs
      const validOverrides = ['returnable', 'not_returnable', 'send_back', 'donation', 'disposal'];
      if (manualOverride && !validOverrides.includes(manualOverride)) {
        return res.status(400).json({ error: "Invalid override value." });
      }
      
      const sanitizedNotes = userNotes ? sanitizeString(userNotes) : null;
      if (sanitizedNotes && sanitizedNotes.length > 500) {
        return res.status(400).json({ error: "User notes too long." });
      }

      await storage.manualEditAnalysis(id, manualOverride, sanitizedNotes || '');
      res.json({ success: true });
    } catch (error) {
      console.error('Error editing analysis:', error);
      res.status(500).json({ error: "Failed to edit analysis" });
    }
  });

  // Get specific analysis
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate ID format
      if (!validateId(id)) {
        return res.status(400).json({ error: "Invalid analysis ID format." });
      }
      
      const analysis = await storage.getShoeAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
