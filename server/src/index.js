// require("dotenv").config({ path: "./env" });

import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import connectDB from "./db/index.js";
import redisService from "./config/redis.js";
import CustomerConsumer from "./consumers/customer.consumer.js";
import campaignConsumer from "./consumers/campaign.consumer.js";

import { app } from "./app.js";

// Initialize consumers
const customerConsumer = new CustomerConsumer();

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop consumers
    customerConsumer.stop();
    await campaignConsumer.stop();
    
    // Disconnect Redis
    await redisService.disconnect();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the application
const startApp = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    // Connect to Redis
    await redisService.connect();
    console.log('✅ Redis connected successfully');
    
    // Start consumer services
    await customerConsumer.start();
    await campaignConsumer.start();
    console.log('✅ Consumer services started');
    
    // Start HTTP server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running successfully on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📦 Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
};

// Start the application
startApp();
