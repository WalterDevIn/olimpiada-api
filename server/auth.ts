import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Generate a simple token for API testing tools that can't handle cookies
    const token = Buffer.from(`${req.user!.id}:${req.user!.email}:${Date.now()}`).toString('base64');
    res.status(200).json({ 
      ...req.user, 
      token: token // Include token for tools like Hoppscotch
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Middleware to check both session and Authorization header
  const requireAuth = (req: any, res: any, next: any) => {
    // Check session first
    if (req.isAuthenticated()) {
      return next();
    }
    
    // Check Authorization header for API testing tools
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [userId] = decoded.split(':');
        
        // Simple token validation - in production use proper JWT
        if (userId) {
          storage.getUser(parseInt(userId)).then(user => {
            if (user) {
              req.user = user;
              return next();
            }
            return res.status(401).json({ message: "Invalid token" });
          }).catch(() => {
            return res.status(401).json({ message: "Invalid token" });
          });
        } else {
          return res.status(401).json({ message: "Invalid token format" });
        }
      } catch (error) {
        return res.status(401).json({ message: "Invalid token format" });
      }
    } else {
      return res.status(401).json({ message: "Authentication required" });
    }
  }

  app.get("/api/user", requireAuth, (req, res) => {
    res.json(req.user);
  });

  // Export the requireAuth middleware for use in other routes
  return { requireAuth };
}
