import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger/index.js';

const app = express();

// More explicit CORS configuration for debugging
app.use(cors({ 
  origin: ["http://localhost:5173", "http://localhost:5174", "https://insight-crm-eight.vercel.app"], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: "100kb" }));
// app.use(express.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// routes import
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import customerRouter from "./routes/customer.route.js";
import orderRouter from "./routes/order.route.js";
import AIRouter from "./routes/ai.route.js";
import segmentRouter from "./routes/segment.route.js";
import trackingRouter from "./routes/tracking.route.js";
import debugRouter from "./routes/debug.route.js";
import testRouter from "./routes/test.route.js";
import globalErrorHandler from "./middleware/errorhandler.middleware.js";

// routes declaration
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/customer", customerRouter);
app.use("/api/order", orderRouter);
app.use("/api/ai", AIRouter);
app.use("/api/segment", segmentRouter);
app.use("/api/track", trackingRouter);
app.use("/api/debug", debugRouter);
app.use("/api/test", testRouter);
// https://localhost:8000/api/v1/users/xyz

app.use(globalErrorHandler);

export { app };
