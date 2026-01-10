import { Room, Track, RemoteTrackPublication, LocalTrackPublication, TrackPublication } from 'livekit-client';

export class MeetingTranscriptCapture {
  private room: Room;
  private transcript: string[] = [];
  private participants: Set<string> = new Set();
  private startTime: Date | null = null;
  private isCapturing: boolean = false;

  constructor(room: Room) {
    this.room = room;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.room.on('trackSubscribed', (track, publication, participant) => {
      if (track.kind === 'audio' && publication.track) {
        this.participants.add(participant.identity || participant.name || 'Unknown');
        console.log(`Participant joined: ${participant.identity || participant.name}`);
      }
    });

    this.room.on('participantConnected', (participant) => {
      this.participants.add(participant.identity || participant.name || 'Unknown');
      const name = participant.identity || participant.name || 'Unknown';
      this.addTranscriptEntry(`${name} joined the meeting`);
    });

    this.room.on('participantDisconnected', (participant) => {
      const name = participant.identity || participant.name || 'Unknown';
      this.addTranscriptEntry(`${name} left the meeting`);
      this.participants.delete(name);
    });

    this.room.on('localTrackPublished', (publication, participant) => {
      if (publication.track?.kind === 'audio') {
        const name = participant.identity || participant.name || 'Unknown';
        this.participants.add(name);
      }
    });

    this.room.on('activeSpeakersChanged', (speakers) => {
      if (speakers.length > 0) {
        const speaker = speakers[0];
        const name = speaker.identity || speaker.name || 'Unknown';
        this.addTranscriptEntry(`${name} is speaking`);
      }
    });
  }

  private addTranscriptEntry(entry: string): void {
    if (this.isCapturing) {
      const timestamp = new Date().toISOString();
      this.transcript.push(`[${timestamp}] ${entry}`);
    }
  }

  startCapture(): void {
    this.isCapturing = true;
    this.startTime = new Date();
    this.transcript = [];
    const localParticipant = this.room.localParticipant;
    if (localParticipant.identity) {
      this.participants.add(localParticipant.identity);
      this.addTranscriptEntry(`Meeting started. ${localParticipant.identity} is the host.`);
    }
    console.log('Meeting transcript capture started');
  }

  stopCapture(): {
    transcript: string;
    participants: string[];
    duration?: number;
  } {
    this.isCapturing = false;
    const endTime = new Date();
    const duration = this.startTime
      ? Math.round((endTime.getTime() - this.startTime.getTime()) / 1000 / 60)
      : undefined;

    const fullTranscript = this.transcript.join('\n');
    
    const result = {
      transcript: fullTranscript,
      participants: Array.from(this.participants),
      duration,
    };

    console.log('Meeting transcript capture stopped', { duration, participants: result.participants.length });
    
    return result;
  }

  getCurrentTranscript(): string {
    return this.transcript.join('\n');
  }

  addManualEntry(entry: string, participant?: string): void {
    if (this.isCapturing) {
      const timestamp = new Date().toISOString();
      const prefix = participant ? `[${participant}]` : '[System]';
      this.transcript.push(`[${timestamp}] ${prefix} ${entry}`);
    }
  }

  cleanup(): void {
    this.transcript = [];
    this.participants.clear();
    this.startTime = null;
    this.isCapturing = false;
  }
}

