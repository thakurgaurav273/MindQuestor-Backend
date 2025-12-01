import { User } from "../model/user.model";
import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

const createUser = async (req: express.Request, res: express.Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }
        if (username || email) {
            const existingUser = await User.findOne({ $or: [{ username }, { email }] });
            if (existingUser) {
                return res.status(409).json({ message: 'Username already exists', user: existingUser });
            }
        }
        let hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, sessionHistory: [], quizHistory: [] });
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
};

const updateUserQuizHistory = async (uid: string, quizId: string) => {  
  try {
    const updatedUser = await User.findByIdAndUpdate(
      uid,
      { 
        $addToSet: { 
          sessionHistory: new mongoose.Types.ObjectId(quizId) 
        } 
      },
      { 
        new: true,
        runValidators: true
      }
    );
    return updatedUser;
  } catch (error) {
    console.error("Error updating user quiz history:", error);
    throw error;
  }
};

// user.controller.ts

const getUserQuizHistory = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find user and populate the sessionHistory with Quiz details
    const user = await User.findById(userId).populate({
      path: 'sessionHistory',
      select: 'inviteCode category sessionStatus createdAt questions createdBy',
      options: { sort: { createdAt: -1 } } // Sort by most recent first
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      quizHistory: user.sessionHistory,
      totalQuizzes: user.sessionHistory?.length || 0
    });
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export { createUser, updateUserQuizHistory, getUserQuizHistory };