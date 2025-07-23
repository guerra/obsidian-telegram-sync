# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-22-audio-transcription-whisper/spec.md

> Created: 2025-07-22
> Version: 1.0.0

## Test Coverage

### Unit Tests

**OpenAIService**
- Constructor properly initializes with API key
- `isConfigured()` returns correct state based on API key presence
- `transcribeAudio()` handles successful transcription response
- `transcribeAudio()` throws appropriate errors for invalid inputs
- Properly formats multipart request with audio buffer
- Handles timeout scenarios gracefully

**Settings Validation**
- OpenAI settings properly saved and loaded
- API key field uses password type for security
- Enable/disable toggle properly controls feature
- Max file size validation (1-25 MB range)
- Timeout validation (10-120 seconds range)

**Audio File Detection**
- Correctly identifies audio MIME types
- Handles Telegram voice message format (.ogg)
- Detects common audio formats (.mp3, .wav, .m4a)
- Rejects non-audio files
- Validates file size before processing

### Integration Tests

**Audio Transcription Flow**
- Voice message triggers transcription when OpenAI configured
- Audio file download completes before transcription starts
- Transcription result passed to template processor
- Template variable {{voiceTranscript}} populated correctly
- Progress bar displays during transcription
- Temporary files cleaned up after processing

**Error Scenarios**
- Missing API key skips transcription gracefully
- Invalid API key shows user-friendly error
- Network timeout falls back to file-only sync
- File too large (>25MB) skips transcription with notice
- Rate limit triggers backoff and retry
- Corrupted audio file handled without crash

**Fallback Behavior**
- Telegram Premium transcription used when available
- OpenAI transcription preferred when both configured
- No transcription when neither service available
- Existing file sync continues regardless of transcription

### Feature Tests

**End-to-End Scenarios**
- User sends voice message → transcribed text appears in note
- Multiple audio files in one message all transcribed
- Mixed media message (audio + images) processed correctly
- Channel audio messages transcribed with metadata preserved
- Settings changes take effect immediately

**Performance Tests**
- Concurrent transcription respects 3-file limit
- Large audio file (near 25MB) completes within timeout
- Multiple small files process efficiently
- Memory usage remains stable during transcription

### Mocking Requirements

**OpenAI API**
- Mock successful transcription responses
- Mock various error responses (auth, rate limit, etc.)
- Mock timeout scenarios
- Variable response times for progress testing

**File System**
- Mock temporary file creation and deletion
- Mock file size checks
- Mock audio file reading

**Telegram Bot API**
- Mock audio file download stream
- Mock file metadata responses
- Mock voice message specific attributes

**Obsidian API**
- Mock settings save/load
- Mock progress bar (Notice) creation
- Mock file write operations

## Manual Testing Checklist

### Configuration
- [ ] Can add OpenAI API key in settings
- [ ] API key field shows as password input
- [ ] Enable/disable toggle works correctly
- [ ] Settings persist after plugin reload

### Basic Functionality
- [ ] Voice message transcribed successfully
- [ ] Audio file (.mp3) transcribed successfully
- [ ] Transcription appears in note with correct formatting
- [ ] Progress shown during transcription

### Error Handling
- [ ] Invalid API key shows clear error message
- [ ] Network error doesn't crash plugin
- [ ] Large file (>25MB) skipped with notice
- [ ] Unsupported format handled gracefully

### Edge Cases
- [ ] Multiple audio files in single message
- [ ] Very short audio (< 1 second)
- [ ] Very long audio (> 10 minutes)
- [ ] Special characters in transcription
- [ ] Non-English audio content