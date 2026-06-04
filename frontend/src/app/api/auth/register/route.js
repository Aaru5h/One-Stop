import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import User from '@/lib/models/User';
import Library from '@/lib/models/Library';
import { generateToken } from '@/lib/middleware/auth';

export async function POST(request) {
  try {
    await dbConnect();
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide email and password' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name: name || ''
    });

    // Create empty library for user
    await Library.create({ userId: user._id });

    // Generate token
    const token = generateToken(user._id);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      token
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
