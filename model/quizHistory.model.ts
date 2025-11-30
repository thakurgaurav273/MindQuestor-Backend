import mongoose  from "mongoose";

const QuizHistorySchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  rank: { type: Number, required: true },
  playedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const QuizHistory = mongoose.model('QuizHistory', QuizHistorySchema);    