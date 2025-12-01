import { getIO } from "../index";
import { ChatMessage } from "../model/chat.model";
import { Request, Response } from "express";
import { Quiz } from "../model/quiz.model";

const sendMessage = async (req: Request, res: Response) => {
    try {
        const { messageType, quizId, senderId, text, username } = req.body;
        const quiz = await Quiz.findOne({ inviteCode: quizId });
        if (!quiz) throw new Error('Quiz not found');
        const newMessage = new ChatMessage({
            quizId: quiz._id,
            senderId,
            username,
            message: text,
            messageType,
        });
        await newMessage.save();
        newMessage.save();

        const io = getIO();
        io.to(quizId).emit("message:received", {
            quizId,
            senderId,
            username,
            text,
            messageType,
            timestamp: Date.now(),
            // _id: newMessage._id
        });

        res.status(200).json({
            message: "Message Sent!",
            data: newMessage
        })
    } catch (error) {
        res.status(403).json({
            message: "Unable to send message",
            errorMessage: error
        })
    }

}

export { sendMessage };