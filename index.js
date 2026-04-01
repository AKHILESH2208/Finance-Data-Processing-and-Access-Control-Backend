import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(morgan("dev"));
app.use("/api/", limiter);

app.use("/api/auth", authRoutes);
app.use("/", recordRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔌 Listening in closely! Your Zorvyn backend is running natively on port ${PORT}`);
});