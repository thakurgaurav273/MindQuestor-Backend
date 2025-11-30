import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema({
    inviteCode: { type: String, required: true },
    sessionStatus: { type: String, enum: ['WAITING', 'COMPLETED', 'ACTIVE'], default: 'not started' },
    startTime: { type: Date },
    endTime: { type: Date },
    difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], required: false },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    currentQuestionIndex: { type: Number, default: 0 },
    chatEnabled: { type: Boolean, default: false, required: false },
    questions: [
        {
            questionText: { type: String, required: true },
            options: [{ type: String, required: true }],
            correctAnswerIndex: { type: Number, required: true }
        }
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },               
}, {
    timestamps: true
});

export const Quiz = mongoose.model('Quiz', QuizSchema);