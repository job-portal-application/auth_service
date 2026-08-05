import express from "express";
import dotenv from "dotenv";
import authRoutes from './routes/authRoutes.js';
import { initDB } from "./config/connect.js";
import { connectKafka } from "./producer.js";
import { redisConnect } from "./redis/redis.js";
import cors from 'cors';

dotenv.config();

const app = express();

const buildCorsOptions = () => {
    const allowedOrigins = (process.env.FRONTEND_URL || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    return {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(null, false);
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
    };
};

app.use(cors(buildCorsOptions()));

app.use(express.json({
    limit: "100mb"
}));
app.use(express.urlencoded({ extended: true }));

initDB();

connectKafka();

redisConnect();

app.use('/api/v1/auth', authRoutes);

export { buildCorsOptions };
export default app;