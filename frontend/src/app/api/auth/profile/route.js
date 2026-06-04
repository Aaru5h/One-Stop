import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/middleware/auth';
import dbConnect from '@/lib/db/connect';
import User from '@/lib/models/User';

export async function PUT(request) {
  try {
    await dbConnect();
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authorized - no token provided' }, { status: 401 });
    }

    const { name, avatar, preferences } = await request.json();

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { 
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(preferences !== undefined && { preferences })
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        preferences: updatedUser.preferences
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
