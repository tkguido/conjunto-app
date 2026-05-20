import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const updates = await request.json();

  const updatedPost = await db.updatePost(id, updates);

  if (updatedPost) {
    return NextResponse.json(updatedPost);
  } else {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
}
