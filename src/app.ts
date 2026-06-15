import express from "express";
import dotenv from "dotenv";
import authRoutes from './routes/authRoutes.js';
import { initDB } from "./config/connect.js";
import { connectKafka } from "./producer.js";
import { redisConnect } from "./redis/redis.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDB();

connectKafka();

redisConnect();

app.use('/api/v1/auth', authRoutes);

export default app;