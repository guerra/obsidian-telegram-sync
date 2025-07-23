import OpenAI from "openai";
import { Notice } from "obsidian";

export interface TranscriptionResult {
	text: string;
	duration?: number;
	cost?: number;
}

export class OpenAIService {
	private static instance: OpenAIService | null = null;
	private openai: OpenAI | null = null;
	private apiKey: string | null = null;
	private isInitialized = false;

	// Retry configuration
	private readonly MAX_RETRIES = 3;
	private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
	private readonly MAX_RETRY_DELAY = 16000; // 16 seconds

	// Private constructor for singleton pattern
	private constructor() {}

	/**
	 * Get the singleton instance of OpenAIService
	 */
	public static getInstance(): OpenAIService {
		if (!OpenAIService.instance) {
			OpenAIService.instance = new OpenAIService();
		}
		return OpenAIService.instance;
	}

	/**
	 * Initialize the OpenAI client with API key
	 */
	public initialize(apiKey: string): void {
		if (!apiKey || apiKey.trim() === "") {
			throw new Error("OpenAI API key is required");
		}

		// Only reinitialize if the API key has changed
		if (this.apiKey === apiKey && this.isInitialized) {
			return;
		}

		try {
			this.openai = new OpenAI({
				apiKey: apiKey.trim(),
			});
			this.apiKey = apiKey.trim();
			this.isInitialized = true;
		} catch (error) {
			this.isInitialized = false;
			throw new Error(`Failed to initialize OpenAI client: ${error.message}`);
		}
	}

	/**
	 * Check if the service is properly configured and ready to use
	 */
	public isConfigured(): boolean {
		return this.isInitialized && this.openai !== null && this.apiKey !== null;
	}

	/**
	 * Transcribe audio using OpenAI Whisper API
	 */
	public async transcribeAudio(
		audioBuffer: Buffer,
		filename: string,
		options?: {
			language?: string;
			prompt?: string;
			showProgress?: boolean;
		}
	): Promise<TranscriptionResult> {
		if (!this.isConfigured()) {
			throw new Error("OpenAI service is not configured. Please set your API key in settings.");
		}

		// Validate file size (25MB limit)
		const fileSizeInMB = audioBuffer.length / (1024 * 1024);
		if (fileSizeInMB > 25) {
			throw new Error(`Audio file is too large (${fileSizeInMB.toFixed(2)}MB). Maximum size is 25MB.`);
		}

		let lastError: Error | null = null;
		let retryDelay = this.INITIAL_RETRY_DELAY;

		// Retry loop with exponential backoff
		for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
			try {
				if (attempt > 0) {
					// Wait before retry
					await this.delay(retryDelay);
					retryDelay = Math.min(retryDelay * 2, this.MAX_RETRY_DELAY);
				}

				// Create a File object from the buffer
				const file = new File([audioBuffer], filename, {
					type: this.getAudioMimeType(filename),
				});

				// Call Whisper API
				const startTime = Date.now();
				const response = await this.openai!.audio.transcriptions.create({
					file: file,
					model: "whisper-1",
					language: options?.language,
					prompt: options?.prompt,
					response_format: "json",
				});

				const duration = (Date.now() - startTime) / 1000;

				// Calculate estimated cost ($0.006 per minute of audio)
				// Note: We don't have the actual audio duration, so we estimate based on file size
				// Rough estimate: 1MB ≈ 1 minute for typical voice recordings
				const estimatedMinutes = fileSizeInMB;
				const estimatedCost = estimatedMinutes * 0.006;

				return {
					text: response.text,
					duration: duration,
					cost: estimatedCost,
				};
			} catch (error) {
				lastError = error;

				// Check if it's a rate limit error
				if (error.status === 429) {
					if (attempt < this.MAX_RETRIES) {
						const resetTime = this.extractResetTime(error);
						if (resetTime) {
							retryDelay = Math.max(retryDelay, resetTime * 1000);
						}
						console.log(`Rate limited. Retrying in ${retryDelay}ms...`);
						continue;
					}
				}

				// Check if it's an authentication error (don't retry)
				if (error.status === 401) {
					throw new Error("Invalid OpenAI API key. Please check your settings.");
				}

				// Check if it's a bad request (don't retry)
				if (error.status === 400) {
					throw new Error(`Invalid request: ${error.message}`);
				}

				// For other errors, retry if we haven't exceeded max retries
				if (attempt < this.MAX_RETRIES) {
					console.log(`Transcription failed (attempt ${attempt + 1}/${this.MAX_RETRIES + 1}). Retrying...`);
					continue;
				}
			}
		}

		// If we've exhausted all retries, throw the last error
		throw new Error(`Transcription failed after ${this.MAX_RETRIES + 1} attempts: ${lastError?.message}`);
	}

	/**
	 * Clean up resources
	 */
	public destroy(): void {
		this.openai = null;
		this.apiKey = null;
		this.isInitialized = false;
	}

	/**
	 * Helper method to determine audio MIME type from filename
	 */
	private getAudioMimeType(filename: string): string {
		const extension = filename.toLowerCase().split(".").pop();
		const mimeTypes: Record<string, string> = {
			mp3: "audio/mpeg",
			mp4: "audio/mp4",
			mpeg: "audio/mpeg",
			mpga: "audio/mpeg",
			m4a: "audio/mp4",
			wav: "audio/wav",
			webm: "audio/webm",
			ogg: "audio/ogg",
			oga: "audio/ogg",
			opus: "audio/opus",
		};
		return mimeTypes[extension || ""] || "audio/mpeg";
	}

	/**
	 * Helper method to extract reset time from rate limit error
	 */
	private extractResetTime(error: any): number | null {
		try {
			// Try to extract reset time from error headers or response
			if (error.response?.headers?.["x-ratelimit-reset-requests"]) {
				const resetTime = parseInt(error.response.headers["x-ratelimit-reset-requests"]);
				return Math.max(1, resetTime - Math.floor(Date.now() / 1000));
			}
			// Default to 60 seconds if we can't determine reset time
			return 60;
		} catch {
			return null;
		}
	}

	/**
	 * Helper method for delays
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Static method to handle transcription with error notifications
	 */
	public static async transcribeWithNotification(
		audioBuffer: Buffer,
		filename: string,
		apiKey: string,
		options?: {
			language?: string;
			prompt?: string;
			showProgress?: boolean;
			showCostEstimate?: boolean;
		}
	): Promise<TranscriptionResult | null> {
		const service = OpenAIService.getInstance();

		try {
			// Initialize if needed
			if (!service.isConfigured() || service.apiKey !== apiKey) {
				service.initialize(apiKey);
			}

			// Show progress notification if requested
			let progressNotice: Notice | null = null;
			if (options?.showProgress) {
				progressNotice = new Notice("Transcribing audio...", 0);
			}

			try {
				const result = await service.transcribeAudio(audioBuffer, filename, options);

				// Show cost estimate if requested
				if (options?.showCostEstimate && result.cost) {
					new Notice(`Transcription complete. Estimated cost: $${result.cost.toFixed(4)}`, 3000);
				}

				return result;
			} finally {
				// Clean up progress notification
				if (progressNotice) {
					progressNotice.hide();
				}
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			console.error("OpenAI transcription failed:", errorMessage);
			new Notice(`OpenAI transcription failed: ${errorMessage}`, 5000);
			return null;
		}
	}
}