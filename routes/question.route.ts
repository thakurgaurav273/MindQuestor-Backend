import express from 'express';
import { addMultipleQuestions, addNewQuestion } from '../controller/question.controller';

const router = express.Router();

router.post('/add', addNewQuestion);
router.post('/add-multiple', addMultipleQuestions);

export default router;