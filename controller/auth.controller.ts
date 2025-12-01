import { Request, Response } from 'express';
import { User } from '../model/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user: any = await User.findOne({ email });
    if (!user) {
        console.log("User not found with email:", email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password as string); 
    console.log("Password match:", isMatch);
    user.password = '';
    console.log("Generating token for user:", user);
    const payload = {
      userId: user._id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      username: user.username,
      createdAt: user.createdAt
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'defaultsecret', { expiresIn: '3h' });
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // 3. Successful login
    return res.status(200).json({
      message: 'Login successful',
      payload,
      accessToken: token
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Error during login' });
  }
};

const verifyTokenAndGetUserId = (token: string): string | null => {
  let data = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  return data.userId || null;
};

const me = async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ message: 'No access token provided' });
    }

    // Verify token and extract user ID (implementation depends on your auth strategy)
    const userId = verifyTokenAndGetUserId(accessToken);
    if (!userId) {
      return res.status(401).json({ message: 'Invalid access token' });
    }

    const user = await User.findById(userId).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Error fetching user profile' });
  }
};

export { login, me };
