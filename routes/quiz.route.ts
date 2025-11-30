import express from 'express';
import { createQuiz, getQuizDetails } from '../controller/quiz.controller';
const router = express.Router();

router.post('/create', createQuiz);
router.get('/getQuiz/:quizId', getQuizDetails)

export default router;