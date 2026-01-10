import { meetingAssistant } from '@/lib/meeting-assistant/MeetingAssistantService';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomName, transcript, participants, duration } = body;

    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'transcript is required and cannot be empty' },
        { status: 400 },
      );
    }

    const notes = await meetingAssistant.processMeetingTranscript(
      roomName,
      transcript,
      participants || [],
      duration,
    );

    return NextResponse.json({ success: true, notes }, { status: 200 });
  } catch (error) {
    console.error('Error processing meeting:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process meeting',
      },
      { status: 500 },
    );
  }
}

