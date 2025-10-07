import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log("MongoDB connected");
   
  } catch (error) {
    console.log("Mongodb connection error", error);
    console.log("Server will continue without database connection");
    // Don't exit - allow server to run without database for demo purposes
  }
};

export default connectDB;
