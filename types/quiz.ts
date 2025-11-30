import { ObjectId } from "mongoose";

export type QuizHistory = {
    quizId: ObjectId;
    quizzesCreated: number;
    quizzesCompleted: number;
    averageScore: number;
    totalScore: number;
    quizzesWon: number;
}