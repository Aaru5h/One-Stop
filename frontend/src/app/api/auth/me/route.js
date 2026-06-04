import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/middleware/auth';
import dbConnect from '@/lib/db/connect';
import User from '@/lib/models/User';

export async function GET(request) {
  try {
    await dbConnect();
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authorized - no token provided' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 });
  }
}
