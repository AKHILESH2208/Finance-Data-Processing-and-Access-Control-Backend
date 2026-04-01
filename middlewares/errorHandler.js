export const errorHandler = (err, req, res, next) => {
  console.error(`[Global Error Triggered]:`, err.message);

  // Catch those Zod validation errors so they don't hit the DB quietly
  if (err.name === 'ZodError') {
    return res.status(400).json({ 
      error: "Invalid request payload format or parameters.", 
      issues: err.errors 
    });
  }

  // grab a specific status if set, otherwise default to 500 error block
  const statusCode = err.statusCode || 500;
  
  const errorMessage = err.message || "An unexpected internal server error occurred.";

  res.status(statusCode).json({
    error: errorMessage,
    // stack traces are super helpful for debugging, but let's hide them if this goes live in production
    ...(process.env.NODE_ENV !== "production" ? { trace: err.stack } : {}),
  });
};
