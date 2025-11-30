import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from 'mongoose';
import userRoutes from './routes/user.route';
import authRoutes from './routes/auth.route';
import questionRoutes from './routes/question.route';
import quizRoutes from "./routes/quiz.route";
import cors from 'cors';
import { setupQuizSocketHandlers } from './websocket/quizSocket';
const app: express.Application = express();
const port: number = 8080;


app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}))


const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
    origin: 'http://localhost:5173'
}
});

app.use(express.json());
app.use('/user', userRoutes);
app.use('/auth', authRoutes);
app.use("/question", questionRoutes);
app.use("/quiz", quizRoutes);
setupQuizSocketHandlers(io);

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb:// localhost:27017/mindquestor');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectToDatabase();

app.get('/', (req: express.Request, res: express.Response) => {
  res.send('Hello World with TypeScript and Express!');
});

// Server setup
httpServer.listen(port,() => {
  console.log(`Server is running at http://localhost:${port}`);
});