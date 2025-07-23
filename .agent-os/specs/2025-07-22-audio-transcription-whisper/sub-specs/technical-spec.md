# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-22-audio-transcription-whisper/spec.md

> Created: 2025-07-22
> Version: 1.0.0

## Technical Requirements

-   Integrate OpenAI API client for Whisper transcription service
-   Support audio formats: .ogg (Telegram voice), .mp3, .wav, .m4a, .webm
-   Maximum file size: 25MB (Whisper API limit)
-   Transcription timeout: 60 seconds per file
-   Secure storage of OpenAI API key using Obsidian's password field
-   Progress indication during transcription
-   Fallback to existing Telegram Premium transcription if available
-   Rate limit handling with exponential backoff
-   Cost tracking/estimation in settings (optional display)

## Approach Options

**Option A:** Direct API Integration

-   Pros: Full control, can optimize for our use case, no additional dependencies
-   Cons: Need to handle API communication, error handling ourselves

**Option B:** OpenAI Node.js SDK (Selected)

-   Pros: Official SDK, handles auth/errors, TypeScript support, well-maintained
-   Cons: Additional dependency, but minimal impact

**Rationale:** The official OpenAI SDK provides robust error handling, TypeScript types, and is maintained by OpenAI. This reduces our implementation complexity while ensuring compatibility with API changes.

## Implementation Architecture

### 1. Configuration Layer

-   Add `openAiApiKey` to `TelegramSyncSettings` interface
-   Create settings UI section for OpenAI configuration
-   Use Obsidian's password field type for secure key storage
-   Add toggle to enable/disable Whisper transcription

### 2. OpenAI Service Module

-   Create `src/services/openai/OpenAIService.ts`
-   Implement singleton pattern for API client management
-   Methods: `initialize()`, `transcribeAudio()`, `isConfigured()`
-   Handle authentication and client lifecycle

### 3. Audio Processing Integration

-   Modify `handleFiles()` in `handlers.ts` to detect audio files
-   Route audio files to transcription pipeline
-   Maintain existing flow for non-audio files
-   Integrate with existing progress bar system

### 4. Transcription Flow

1. Detect audio file in incoming message
2. Download file to temporary location
3. Check file size (< 25MB)
4. Send to Whisper API
5. Receive transcription
6. Pass to template processor
7. Clean up temporary file

### 5. Error Handling Strategy

-   API key not configured: Skip transcription, log warning
-   API errors: Retry with backoff (3 attempts)
-   Rate limits: Queue and retry after delay
-   Network errors: Fallback to file-only sync
-   File too large: Skip transcription, add note in template

## External Dependencies

-   **openai** (^4.0.0) - Official OpenAI Node.js SDK
-   **Justification:** Official SDK ensures API compatibility and provides TypeScript support. Minimal size impact (~200KB) is acceptable for the functionality gained.

## Security Considerations

-   API keys stored using Obsidian's secure password field
-   Keys never logged or included in error messages
-   Temporary audio files deleted after processing
-   No audio content stored beyond what user explicitly saves

## Performance Considerations

-   Transcription is async and non-blocking
-   Progress bar shows during longer transcriptions
-   File size limit prevents excessive API usage
-   Concurrent transcription limit: 3 files maximum
