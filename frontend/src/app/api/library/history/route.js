import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/middleware/auth';
import dbConnect from '@/lib/db/connect';
import Library from '@/lib/models/Library';

export async function GET(request) {
  try {
    await dbConnect();
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authorized - no token provided' }, { status: 401 });
    }

    const library = await Library.findOne({ userId: user._id });
    if (!library) {
      return NextResponse.json({ success: true, history: [], count: 0 });
    }

    const history = library.watchedHistory.sort(
      (a, b) => new Date(b.watchedAt) - new Date(a.watchedAt)
    );

    return NextResponse.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: 'Failed to fetch watch history' }, { status: 500 });
  }
}
