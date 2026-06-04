import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/middleware/auth';
import dbConnect from '@/lib/db/connect';
import Library from '@/lib/models/Library';

export async function GET(request, context) {
  try {
    await dbConnect();
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authorized - no token provided' }, { status: 401 });
    }

    const { movieId } = await context.params;

    const library = await Library.findOne({ userId: user._id });
    if (!library) {
      return NextResponse.json({ success: true, progress: null });
    }

    const progress = library.continueWatching.find(
      item => item.movieId === parseInt(movieId)
    );

    return NextResponse.json({
      success: true,
      progress: progress || null
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    await dbConnect();
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authorized - no token provided' }, { status: 401 });
    }

    const { movieId } = await context.params;
    const {
      progress,
      currentTime,
      duration,
      title,
      posterPath,
      backdropPath,
      mediaType = 'movie',
      season = null,
      episode = null,
      episodeTitle = null,
    } = await request.json();

    let library = await Library.findOne({ userId: user._id });
    if (!library) {
      library = await Library.create({ userId: user._id });
    }

    const existingIndex = library.continueWatching.findIndex(
      item => item.movieId === parseInt(movieId)
    );

    const progressData = {
      movieId: parseInt(movieId),
      progress: Math.min(100, Math.max(0, progress)),
      currentTime: currentTime || 0,
      duration: duration || 0,
      title,
      posterPath,
      backdropPath,
      mediaType,
      season,
      episode,
      episodeTitle,
      lastWatched: new Date()
    };

    if (existingIndex > -1) {
      library.continueWatching[existingIndex] = {
        ...library.continueWatching[existingIndex].toObject(),
        ...progressData
      };
    } else {
      library.continueWatching.push(progressData);
    }

    if (progress >= 95) {
      const historyExists = library.watchedHistory.some(
        item => item.movieId === parseInt(movieId)
      );
      if (!historyExists) {
        library.watchedHistory.push({
          movieId: parseInt(movieId),
          mediaType,
          watchedAt: new Date()
        });
      }
    }

    await library.save();

    return NextResponse.json({
      success: true,
      message: 'Progress updated',
      progress: progressData
    });
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
