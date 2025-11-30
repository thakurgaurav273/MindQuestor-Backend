import { Request, Response } from "express";
import { getRandomQuestions } from "./question.controller";
import { Quiz } from "../model/quiz.model";
import { updateUserQuizHistory } from "./user.controller";

const createQuiz = async (req: Request, res: Response) => {
  try {
    const { category, count, inviteCode, sessionStatus, startTime, endTime, participants, currentQuestionIndex, createdBy } = req.body;
    if (!category || !count) {
      return res.status(400).json({ error: "Category and count are required" });
    }

    const rawQuestions = await getRandomQuestions(category, count);
    const mappedQuestions = rawQuestions?.map(q => ({
      questionText: q.question,
      options: q.options,
      correctAnswerIndex: q.correct_answer_index,
      questionId: q._id
    }));

    const newQuiz = new Quiz({
      inviteCode: inviteCode,
      category: category,
      sessionStatus: sessionStatus,
      startTime: startTime,
      endTime: endTime,
      participants: participants,
      questions: mappedQuestions,
      currentQuestionIndex: currentQuestionIndex,
      createdBy: createdBy
    })
    
    newQuiz.save();
    await updateUserQuizHistory(createdBy, newQuiz._id.toString());
    return res.status(200).json({ newQuiz });
  } catch (error) {
    console.error("Error in createQuiz:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getQuizDetails = async (req: Request, res: Response) => {
  const quizId = req.params.quizId;

  try {
    const quizData = await Quiz.findOne({ _id: quizId }).lean();

    if (!quizData) {
      return res.status(404).json({
        message: `Quiz with id: ${quizId} doesn't exist`,
      });
    }
    
    let filteredResults = {
      ...quizData,
      questions: quizData.questions.map((question) => {
        const { correctAnswerIndex, ...rest } = question;
        return rest;
      }),
    };
    
    return res.status(200).json({ quizDetails: filteredResults });
  } catch (error) {
    return res.status(500).json({
      message: 'Error fetching quiz details',
    });
  }
};

const updateQuizDetails = async (quizId: string, newStatus: string) => {
  const updatedQuizDetails = await Quiz.findByIdAndUpdate(
    quizId,
    { sessionStatus: newStatus },
    { new: true }
  );
  return updatedQuizDetails;
};

export { createQuiz, getQuizDetails, updateQuizDetails };
