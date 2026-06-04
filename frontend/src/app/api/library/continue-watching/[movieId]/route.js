import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/middleware/auth';
import dbConnect from '@/lib/db/connect';
import Library from '@/lib/models/Library';

export async function DELETE(request, context) {
  try {
    await dbConnect();
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authorized - no token provided' }, { status: 401 });
    }

    const { movieId } = await context.params;

    const library = await Library.findOne({ userId: user._id });
    if (!library) {
      return NextResponse.json({ error: 'Library not found' }, { status: 404 });
    }

    library.continueWatching = library.continueWatching.filter(
      item => item.movieId !== parseInt(movieId)
    );

    await library.save();

    return NextResponse.json({
      success: true,
      message: 'Removed from continue watching'
    });
  } catch (error) {
    console.error('Remove continue watching error:', error);
    return NextResponse.json({ error: 'Failed to remove from continue watching' }, { status: 500 });
  }
}
