import jwt from 'jsonwebtoken';
import dbConnect from '../db/connect.js';
import User from '../models/User.js';

export async function getSessionUser(request) {
  try {
    await dbConnect();
    let token;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    return user || null;
  } catch (error) {
    console.error('Session user error:', error);
    return null;
  }
}

export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};
