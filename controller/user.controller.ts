import { User } from "../model/user.model";
import express from "express";
import bcrypt from "bcrypt";

const createUser = async (req: express.Request, res: express.Response) => {
    try {
        const { username, email, password} = req.body;

        console.log("Received user data:", req.body);
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }
        if(username || email){
            const existingUser = await User.findOne({ $or: [ { username }, { email } ] });
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

export { createUser };