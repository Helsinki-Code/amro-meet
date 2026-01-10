import {
  GoogleGenAI,
  LiveServerMessage,
  MediaResolution,
  Modality,
  Session,
} from '@google/genai';
import mime from 'mime';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface MeetingNotes {
  meetingId: string;
  roomName: string;
  timestamp: string;
  summary: string;
  actionItems: ActionItem[];
  keyTopics: string[];
  participants: string[];
  transcript?: string;
  duration?: number;
}

export interface ActionItem {
  description: string;
  assignee?: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

const NOTES_DIR = join(process.cwd(), 'data', 'meetings');
const AUDIO_DIR = join(process.cwd(), 'data', 'audio');

class MeetingAssistantService {
  private ai: GoogleGenAI | null = null;
  private sessions: Map<string, Session> = new Map();
  private responseQueues: Map<string, LiveServerMessage[]> = new Map();
  private audioParts: Map<string, string[]> = new Map();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async initializeSession(roomName: string): Promise<Session> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY not configured. Please set GEMINI_API_KEY in your environment variables.');
    }

    const model = 'models/gemini-2.5-flash-native-audio-preview-12-2025';

    const config = {
      responseModalities: [Modality.AUDIO],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Leda',
          },
        },
      },
      contextWindowCompression: {
        triggerTokens: '25600',
        slidingWindow: { targetTokens: '12800' },
      },
    };

    const responseQueue: LiveServerMessage[] = [];
    this.responseQueues.set(roomName, responseQueue);

    const session = await this.ai.live.connect({
      model,
      callbacks: {
        onopen: () => {
          console.log(`Session opened for room: ${roomName}`);
        },
        onmessage: (message: LiveServerMessage) => {
          responseQueue.push(message);
          this.handleModelTurn(roomName, message);
        },
        onerror: (e: ErrorEvent) => {
          console.error(`Session error for ${roomName}:`, e.message);
        },
        onclose: (e: CloseEvent) => {
          console.log(`Session closed for ${roomName}:`, e.reason);
          this.sessions.delete(roomName);
          this.responseQueues.delete(roomName);
          this.audioParts.delete(roomName);
        },
      },
      config,
    });

    this.sessions.set(roomName, session);

    const initialPrompt = `You are a professional meeting assistant. Listen carefully to this meeting and prepare to generate:
1. A comprehensive summary
2. Actionable action items with assignees and priorities
3. Key topics discussed
4. Participant contributions

Be precise, professional, and focus on actionable outcomes.`;
    
    session.sendClientContent({
      turns: [initialPrompt],
    });

    return session;
  }

  private handleModelTurn(roomName: string, message: LiveServerMessage): void {
    if (message.serverContent?.modelTurn?.parts) {
      const part = message.serverContent.modelTurn.parts[0];

      if (part?.fileData) {
        console.log(`File received for ${roomName}: ${part.fileData.fileUri}`);
      }

      if (part?.inlineData) {
        const parts = this.audioParts.get(roomName) || [];
        parts.push(part.inlineData?.data ?? '');
        this.audioParts.set(roomName, parts);
      }

      if (part?.text) {
        console.log(`Text response for ${roomName}:`, part.text);
      }
    }
  }

  private async handleTurn(roomName: string): Promise<LiveServerMessage[]> {
    const turn: LiveServerMessage[] = [];
    let done = false;
    const timeout = Date.now() + 120000;

    while (!done && Date.now() < timeout) {
      const message = await this.waitMessage(roomName);
      if (message) {
        turn.push(message);
        if (message.serverContent && message.serverContent.turnComplete) {
          done = true;
        }
      }
    }

    return turn;
  }

  private async waitMessage(roomName: string): Promise<LiveServerMessage | null> {
    const queue = this.responseQueues.get(roomName) || [];
    if (queue.length > 0) {
      return queue.shift() || null;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    return null;
  }

  private extractTranscript(turn: LiveServerMessage[]): string {
    let transcript = '';
    for (const message of turn) {
      if (message.serverContent?.modelTurn?.parts) {
        for (const part of message.serverContent.modelTurn.parts) {
          if (part.text) {
            transcript += part.text + '\n';
          }
        }
      }
    }
    return transcript.trim();
  }

  async processMeetingAudio(
    roomName: string,
    audioData: string,
    mimeType: string = 'audio/wav',
  ): Promise<MeetingNotes> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    await this.ensureDirectories();

    let session = this.sessions.get(roomName);
    if (!session) {
      session = await this.initializeSession(roomName);
    }

    session.sendClientContent({
      turns: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioData,
              },
            },
          ],
        },
      ],
    });

    const turn = await this.handleTurn(roomName);
    const transcript = this.extractTranscript(turn);

    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript generated from audio');
    }

    const notes = await this.generateMeetingNotes(roomName, transcript);

    return notes;
  }

  async processMeetingTranscript(
    roomName: string,
    transcript: string,
    participants: string[] = [],
    duration?: number,
  ): Promise<MeetingNotes> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY not configured. Please set GEMINI_API_KEY in your environment variables.');
    }

    await this.ensureDirectories();

    const notes = await this.generateMeetingNotes(roomName, transcript, participants, duration);
    return notes;
  }

  private async generateMeetingNotes(
    roomName: string,
    transcript: string,
    participants: string[] = [],
    duration?: number,
  ): Promise<MeetingNotes> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const model = 'models/gemini-2.0-flash-exp';

    const prompt = `You are a professional meeting assistant. Analyze this meeting transcript and generate comprehensive, actionable meeting notes.

Meeting Participants: ${participants.join(', ') || 'Not specified'}
${duration ? `Meeting Duration: ${duration} minutes` : ''}

Transcript:
${transcript}

Generate a detailed JSON response with this exact structure:
{
  "summary": "A comprehensive 2-3 paragraph summary of the meeting covering main discussion points, decisions made, and outcomes",
  "actionItems": [
    {
      "description": "Clear, specific, actionable task description",
      "assignee": "Participant name or 'Unassigned' if not mentioned",
      "dueDate": "YYYY-MM-DD format if mentioned, otherwise null",
      "priority": "high|medium|low based on urgency and importance"
    }
  ],
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3", ...],
  "participants": ["Participant 1", "Participant 2", ...]
}

Important guidelines:
- Extract ALL action items mentioned, even if implied
- Assign priority based on language cues (urgent, ASAP, important = high; soon, next week = medium; eventually, later = low)
- List all distinct topics discussed
- Include all participants mentioned in the transcript
- Be precise and professional

Return ONLY valid JSON, no markdown formatting or explanations.`;

    try {
      const session = this.sessions.get(roomName) || (await this.initializeSession(roomName));
      
      session.sendClientContent({
        turns: [prompt],
      });

      const turn = await this.handleTurn(roomName);
      const responseText = this.extractTranscript(turn);

      let parsedResponse: any;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (e) {
        parsedResponse = this.parseNotesFromText(responseText, transcript);
      }

      const meetingId = `meeting-${roomName}-${Date.now()}`;
      const notes: MeetingNotes = {
        meetingId,
        roomName,
        timestamp: new Date().toISOString(),
        summary: parsedResponse.summary || 'Summary extraction failed. Please review the transcript.',
        actionItems: Array.isArray(parsedResponse.actionItems)
          ? parsedResponse.actionItems.map((item: any) => ({
              description: item.description || 'Action item',
              assignee: item.assignee || 'Unassigned',
              dueDate: item.dueDate || undefined,
              priority: (item.priority || 'medium') as 'high' | 'medium' | 'low',
            }))
          : [],
        keyTopics: Array.isArray(parsedResponse.keyTopics)
          ? parsedResponse.keyTopics
          : this.extractTopicsFromTranscript(transcript),
        participants: Array.isArray(parsedResponse.participants)
          ? parsedResponse.participants
          : participants.length > 0
            ? participants
            : ['Unknown'],
        transcript,
        duration,
      };

      await this.saveMeetingNotes(notes);
      return notes;
    } catch (error) {
      console.error('Error generating meeting notes:', error);
      throw new Error(`Failed to generate meeting notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseNotesFromText(text: string, transcript: string): any {
    const summaryMatch = text.match(/(?:summary|overview)[:\s]+([^]*?)(?:\n\n|action|key|topics)/i);
    const topicsMatch = text.match(/(?:topics?|discussed|covered)[:\s]+([^]*?)(?:\n\n|action|summary|participants)/i);

    return {
      summary: summaryMatch?.[1]?.trim() || 'Unable to extract summary automatically.',
      actionItems: [],
      keyTopics: topicsMatch?.[1]
        ? topicsMatch[1]
            .split(/[,;•\n-]/)
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0)
            .slice(0, 10)
        : this.extractTopicsFromTranscript(transcript),
      participants: [],
    };
  }

  private extractTopicsFromTranscript(transcript: string): string[] {
    const sentences = transcript.split(/[.!?]\s+/);
    const topics: string[] = [];
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can']);

    for (const sentence of sentences.slice(0, 50)) {
      const words = sentence.toLowerCase().split(/\s+/);
      const significantWords = words.filter((w) => w.length > 4 && !commonWords.has(w));
      if (significantWords.length > 0) {
        topics.push(sentence.substring(0, 100).trim());
      }
    }

    return [...new Set(topics)].slice(0, 10);
  }

  async answerQuestion(roomName: string, question: string): Promise<string> {
    const notes = await this.loadMeetingNotes(roomName);
    if (!notes) {
      return 'No meeting notes found for this room. Please ensure the meeting has been processed first.';
    }

    if (!this.ai) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const model = 'models/gemini-2.0-flash-exp';

    const prompt = `You are a meeting assistant. Answer the following question based on these meeting notes.

Question: "${question}"

Meeting Information:
- Room: ${notes.roomName}
- Date: ${new Date(notes.timestamp).toLocaleDateString()}
- Duration: ${notes.duration ? `${notes.duration} minutes` : 'Not specified'}

Summary:
${notes.summary}

Action Items:
${notes.actionItems.length > 0
  ? notes.actionItems
      .map((item, i) => `${i + 1}. ${item.description}${item.assignee ? ` (Assigned to: ${item.assignee})` : ''}${item.dueDate ? ` (Due: ${item.dueDate})` : ''} [Priority: ${item.priority}]`)
      .join('\n')
  : 'No action items'}

Key Topics Discussed:
${notes.keyTopics.join(', ')}

Participants:
${notes.participants.join(', ')}

${notes.transcript ? `\nFull Transcript (for reference):\n${notes.transcript.substring(0, 5000)}...` : ''}

Provide a clear, concise, and helpful answer. If the question cannot be answered from the meeting notes, politely indicate that the information is not available in this meeting's notes. Be specific and reference relevant details when possible.`;

    try {
      let session = this.sessions.get(roomName) || (await this.initializeSession(roomName));
      
      session.sendClientContent({
        turns: [prompt],
      });

      const turn = await this.handleTurn(roomName);
      const answer = this.extractTranscript(turn);

      return answer || 'Unable to generate an answer. Please try again.';
    } catch (error) {
      console.error('Error answering question:', error);
      throw new Error(`Failed to answer question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveMeetingNotes(notes: MeetingNotes): Promise<void> {
    await this.ensureDirectories();
    const filePath = join(NOTES_DIR, `${notes.meetingId}.json`);
    await writeFile(filePath, JSON.stringify(notes, null, 2), 'utf-8');
  }

  async loadMeetingNotes(roomName: string): Promise<MeetingNotes | null> {
    try {
      await this.ensureDirectories();
      const { readdir } = await import('fs/promises');
      const dirFiles = await readdir(NOTES_DIR);
      const meetingFiles = dirFiles
        .filter((f) => f.startsWith(`meeting-${roomName}-`) && f.endsWith('.json'))
        .sort()
        .reverse();

      if (meetingFiles.length === 0) {
        return null;
      }

      const latestFile = meetingFiles[0];
      const filePath = join(NOTES_DIR, latestFile);
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as MeetingNotes;
    } catch (error) {
      console.error('Error loading meeting notes:', error);
      return null;
    }
  }

  async getAllMeetingNotes(roomName?: string): Promise<MeetingNotes[]> {
    try {
      await this.ensureDirectories();
      const { readdir } = await import('fs/promises');
      const dirFiles = await readdir(NOTES_DIR);
      const meetingFiles = roomName
        ? dirFiles.filter((f) => f.startsWith(`meeting-${roomName}-`) && f.endsWith('.json'))
        : dirFiles.filter((f) => f.endsWith('.json'));

      const notes: MeetingNotes[] = [];
      for (const file of meetingFiles) {
        try {
          const filePath = join(NOTES_DIR, file);
          const content = await readFile(filePath, 'utf-8');
          notes.push(JSON.parse(content) as MeetingNotes);
        } catch (e) {
          console.error(`Error reading ${file}:`, e);
        }
      }

      return notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error loading all meeting notes:', error);
      return [];
    }
  }

  convertToWav(rawData: string[], mimeType: string): Buffer {
    const options = this.parseMimeType(mimeType);
    const dataLength = rawData.reduce((a, b) => a + Buffer.from(b, 'base64').length, 0);
    const wavHeader = this.createWavHeader(dataLength, options);
    const buffer = Buffer.concat(rawData.map((data) => Buffer.from(data, 'base64')));

    return Buffer.concat([wavHeader, buffer]);
  }

  private parseMimeType(mimeType: string): { numChannels: number; sampleRate: number; bitsPerSample: number } {
    const [fileType, ...params] = mimeType.split(';').map((s) => s.trim());
    const [_, format] = fileType.split('/');

    const options: Partial<{ numChannels: number; sampleRate: number; bitsPerSample: number }> = {
      numChannels: 1,
      bitsPerSample: 16,
    };

    if (format && format.startsWith('L')) {
      const bits = parseInt(format.slice(1), 10);
      if (!isNaN(bits)) {
        options.bitsPerSample = bits;
      }
    }

    for (const param of params) {
      const [key, value] = param.split('=').map((s) => s.trim());
      if (key === 'rate') {
        options.sampleRate = parseInt(value, 10);
      }
    }

    return {
      numChannels: options.numChannels || 1,
      sampleRate: options.sampleRate || 16000,
      bitsPerSample: options.bitsPerSample || 16,
    };
  }

  private createWavHeader(dataLength: number, options: { numChannels: number; sampleRate: number; bitsPerSample: number }): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options;

    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);

    return buffer;
  }

  async saveAudioFile(roomName: string, audioData: string[], mimeType: string): Promise<string> {
    await this.ensureDirectories();
    const fileName = `audio-${roomName}-${Date.now()}.wav`;
    const filePath = join(AUDIO_DIR, fileName);
    const buffer = this.convertToWav(audioData, mimeType);
    await writeFile(filePath, buffer, 'binary');
    return filePath;
  }

  private async ensureDirectories(): Promise<void> {
    try {
      if (!existsSync(NOTES_DIR)) {
        await mkdir(NOTES_DIR, { recursive: true });
      }
      if (!existsSync(AUDIO_DIR)) {
        await mkdir(AUDIO_DIR, { recursive: true });
      }
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        console.error('Error creating directories:', error);
      }
    }
  }

  async closeSession(roomName: string): Promise<void> {
    const session = this.sessions.get(roomName);
    if (session) {
      session.close();
      this.sessions.delete(roomName);
      this.responseQueues.delete(roomName);
      this.audioParts.delete(roomName);
    }
  }

  async cleanup(): Promise<void> {
    for (const roomName of this.sessions.keys()) {
      await this.closeSession(roomName);
    }
  }
}

export const meetingAssistant = new MeetingAssistantService();
