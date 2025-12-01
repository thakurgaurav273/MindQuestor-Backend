import express from 'express';
import { createQuiz, getQuizDetails, getQuizDetailsByInviteCode } from '../controller/quiz.controller';
const router = express.Router();

router.post('/create', createQuiz);
router.get('/getQuiz/:quizId', getQuizDetails)
router.get('/getQuizByCode/:inviteCode', getQuizDetailsByInviteCode)

export default router;