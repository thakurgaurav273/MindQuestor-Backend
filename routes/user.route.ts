import express from 'express';
import { createUser, getUserQuizHistory } from '../controller/user.controller';
const router = express.Router();

router.post('/create', createUser);

router.get('/quiz-history/:userId', getUserQuizHistory);


export default router;