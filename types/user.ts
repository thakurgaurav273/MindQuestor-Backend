import { QuizHistory } from "./quiz";
import { SessionHistory } from "./sessionHistory";
export type user = {
    _id: String;
    name: String;
    email: String;
    password: String;
    createdAt: Date;
    updatedAt: Date;
    avatarUrl?: String;
    quizHistory?: QuizHistory;
    sessionHistory?: Array<SessionHistory>;
}