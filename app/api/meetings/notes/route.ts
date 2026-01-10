import { meetingAssistant } from '@/lib/meeting-assistant/MeetingAssistantService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const roomName = req.nextUrl.searchParams.get('roomName');

    if (roomName) {
      const notes = await meetingAssistant.loadMeetingNotes(roomName);
      if (!notes) {
        return NextResponse.json({ error: 'No meeting notes found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, notes }, { status: 200 });
    } else {
      const allNotes = await meetingAssistant.getAllMeetingNotes();
      return NextResponse.json({ success: true, notes: allNotes }, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching meeting notes:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch meeting notes',
      },
      { status: 500 },
    );
  }
}

