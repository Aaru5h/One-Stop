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

    let library = await Library.findOne({ userId: user._id });
    if (!library) {
      library = await Library.create({ userId: user._id });
    }

    const watchlist = library.watchlist.sort(
      (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
    );

    return NextResponse.json({
      success: true,
      watchlist,
      count: watchlist.length
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}
