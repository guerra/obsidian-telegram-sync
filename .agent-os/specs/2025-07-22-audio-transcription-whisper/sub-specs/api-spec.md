# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-07-22-audio-transcription-whisper/spec.md

> Created: 2025-07-22
> Version: 1.0.0

## External API Integration

### OpenAI Whisper API

**Endpoint:** POST https://api.openai.com/v1/audio/transcriptions

**Purpose:** Transcribe audio files to text using OpenAI's Whisper model

**Request Format:**
- Method: POST
- Content-Type: multipart/form-data
- Authentication: Bearer token in Authorization header

**Parameters:**
- `file`: Audio file (binary) - Required
- `model`: "whisper-1" - Required
- `response_format`: "json" - Optional (default)
- `temperature`: 0 - Optional (for deterministic results)

**Supported Formats:** mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg

**Response Format:**
```json
{
  "text": "Transcribed text content here..."
}
```

**Error Response:**
```json
{
  "error": {
    "message": "Error description",
    "type": "error_type",
    "param": null,
    "code": "error_code"
  }
}
```

**Rate Limits:**
- 50 requests per minute
- 25MB max file size
- Timeout: 30 seconds recommended

## Internal Service Interface

### OpenAIService Class

```typescript
interface OpenAIService {
  initialize(apiKey: string): void;
  transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string>;
  isConfigured(): boolean;
  destroy(): void;
}
```

### Integration Points

**TelegramSyncSettings Extension:**
```typescript
interface TelegramSyncSettings {
  // ... existing settings
  openAi: {
    apiKey: string;
    enableTranscription: boolean;
    maxFileSize: number; // in MB, default 25
    timeout: number; // in seconds, default 30
  };
}
```

**Message Handler Integration:**
- Hook: `handleFiles()` in `handlers.ts`
- Detection: Check MIME type for audio/*
- Priority: Whisper > Telegram Premium > No transcription

## Error Handling

### API Error Codes
- `invalid_api_key`: Invalid authentication
- `rate_limit_exceeded`: Too many requests
- `model_not_found`: Invalid model specified
- `invalid_file_format`: Unsupported audio format
- `file_too_large`: File exceeds 25MB limit

### Error Handling Strategy
1. **Authentication Errors**: Disable transcription, notify user
2. **Rate Limits**: Implement exponential backoff
3. **Network Errors**: Retry up to 3 times
4. **Format Errors**: Skip transcription, process file normally
5. **Timeout**: Cancel request, process without transcription

## Cost Considerations

**Whisper API Pricing**: $0.006 per minute of audio

**Cost Estimation:**
- Display estimated cost in settings (optional)
- Track usage if enabled
- Warn if unusual usage detected