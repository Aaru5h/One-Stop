import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/middleware/auth';
import dbConnect from '@/lib/db/connect';
import Library from '@/lib/models/Library';

export async function POST(request, context) {
  try {
    await dbConnect();
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authorized - no token provided' }, { status: 401 });
    }

    const { movieId } = await context.params;
    const { title, posterPath, mediaType = 'movie' } = await request.json();

    let library = await Library.findOne({ userId: user._id });
    if (!library) {
      library = await Library.create({ userId: user._id });
    }

    // Check if already in watchlist
    const exists = library.watchlist.some(
      item => item.movieId === parseInt(movieId)
    );

    if (exists) {
      return NextResponse.json({ error: 'Already in watchlist' }, { status: 400 });
    }

    // Add to watchlist
    library.watchlist.push({
      movieId: parseInt(movieId),
      title,
      posterPath,
      mediaType,
      addedAt: new Date()
    });

    await library.save();

    return NextResponse.json({
      success: true,
      message: 'Added to watchlist',
      item: library.watchlist[library.watchlist.length - 1]
    }, { status: 201 });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

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

    const initialLength = library.watchlist.length;
    library.watchlist = library.watchlist.filter(
      item => item.movieId !== parseInt(movieId)
    );

    if (library.watchlist.length === initialLength) {
      return NextResponse.json({ error: 'Movie not in watchlist' }, { status: 404 });
    }

    await library.save();

    return NextResponse.json({
      success: true,
      message: 'Removed from watchlist'
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}
