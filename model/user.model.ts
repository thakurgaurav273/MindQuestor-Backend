import mongoose, { Schema } from 'mongoose';
import { user } from '../types/user';

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    sessionHistory: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
        default: [],
    },
    quizHistory: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuizHistory" }],
        default: [],
    },
}, {
    timestamps: true
});

export const User = mongoose.model<user>('User', UserSchema);