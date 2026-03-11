import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { authRouter, bookingRouter, contactRouter, reviewRouter } from './routes/index.js';

dotenv.config();
connectDB();

const app = express();

/* ✅ CORS FIRST */
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://sonictreadmillrepairs.com"
  ],
  credentials: true
}));

/* handle preflight */
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* routes */
app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/reviews', reviewRouter);

app.get('/api/health', (_, res) =>
  res.json({
    status: "✅ Sonic Treadmill Repairs API Running",
    time: new Date()
  })
);

/* ❗ move this LAST */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Sonic Treadmill Repairs Server on port ${PORT}`);
});