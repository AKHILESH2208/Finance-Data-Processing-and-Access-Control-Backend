import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../models/db.js";
import { registerSchema, loginSchema } from "../validations/schemas.js";
import { JWT_SECRET } from "../middlewares/auth.js";

export const register = async (req, res, next) => {
  try {
    // using zod to validate the incoming data
    const { email, password, role } = registerSchema.parse(req.body);
    
    // check if this guy already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: "Looks like that email is already registered." });
    }

    // 12 salt rounds is generally considered a good balance for bcrypt these days
    const passwordHash = await bcrypt.hash(password, 12);
    
    // create the new user record
    const user = await prisma.user.create({ 
      data: { 
        email, 
        passwordHash, 
        role: role || "VIEWER" // defaulting to lowest privilege just in case
      } 
    });
    
    res.status(201).json({ 
      message: "User created successfully!", 
      userId: user.id 
    });

  } catch (err) { 
    console.error("Auth register error:", err);
    next(err); 
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    // if user doesn't exist or password doesn't match...
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Hmm, invalid credentials. Try again." });
    }

    // sign the token, keeping it alive for half a day
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: "12h" }
    );
    
    // pass it back to the client
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      } 
    });

  } catch (err) { 
    console.error("Auth login error:", err);
    next(err); 
  }
};