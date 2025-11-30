import QuestionModel from "../model/question.model";
import { Request, Response } from "express";

const addNewQuestion = async (req: Request, res: Response) => {
    try {
        let newQuestionData = req.body.question;
        const newQuestion = new QuestionModel(newQuestionData);
        await newQuestion.save();
        res.status(201).json({ message: "Question added successfully", question: newQuestion });
    } catch (error) {
        console.error("Error adding question:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getRandomQuestions = async (category: string, count: number) => {
    try {
        let categoryCode = "HI";
        let db_category = "History";
        if (category === 'gk') {
            categoryCode = "GK";
            db_category = "General Knowledge"
        } else if (category === 'science') {
            categoryCode = "SC";
            db_category = "Science"
        } else {
            categoryCode = "HI";
            db_category = "General Knowledge"

        }
        const questions = await QuestionModel.aggregate([
            { $match: { category: db_category } },
            { $sample: { size: count } }
        ]);

        console.log(questions);
        return questions;
    } catch (err) {

    }
}

const addMultipleQuestions = async (req: Request, res: Response) => {
    try {
        let questionsArray = req.body.questionsArray;
        const result = await QuestionModel.insertMany(questionsArray);
        res.status(201).json({ message: "Questions added successfully", questions: result });
    } catch (error) {
        console.error("Error adding multiple questions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
export { addNewQuestion, addMultipleQuestions, getRandomQuestions };