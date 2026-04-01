import jwt from "jsonwebtoken";

// using a fallback here just in case, but really should always have process.env set up!
export const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_here_make_it_long_and_random";

export const authenticate = (req, res, next) => {
  // looking for the Bearer token in the auth header
  const authHeader = req.header("Authorization");
  
  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. You need a token to get through here!" });
  }
  
  // cleaning off the "Bearer " string chunk
  const token = authHeader.replace("Bearer ", "");
  
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    // attaching it to the request object so next controllers can use it
    req.user = verified; 
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({ error: "Not quite! Seems like your token is invalid or expired." });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    // checking if they have the necessary credentials / roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Not allowed. Your current role (${req.user.role}) can't access this route.` });
    }
    // we're good to go!
    next();
  };
};