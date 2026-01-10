import { meetingAssistant } from '@/lib/meeting-assistant/MeetingAssistantService';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomName, question } = body;

    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    const answer = await meetingAssistant.answerQuestion(roomName, question);

    return NextResponse.json({ success: true, answer }, { status: 200 });
  } catch (error) {
    console.error('Error answering question:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to answer question',
      },
      { status: 500 },
    );
  }
}

