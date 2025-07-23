import { Modal, Setting } from "obsidian";
import TelegramSyncPlugin from "src/main";
import { _5sec } from "src/utils/logUtils";
import {
	ConnectionStatusIndicatorType,
	KeysOfConnectionStatusIndicatorType,
	connectionStatusIndicatorSettingName,
} from "src/ConnectionStatusIndicator";

export class AdvancedSettingsModal extends Modal {
	advancedSettingsDiv: HTMLDivElement;
	saved = false;
	constructor(public plugin: TelegramSyncPlugin) {
		super(plugin.app);
	}

	async display() {
		this.addHeader();

		this.addConnectionStatusIndicator();
		this.addDeleteMessagesFromTelegram();
		this.addMessageDelimiterSetting();
		this.addParallelMessageProcessing();
		
		// OpenAI Settings Section
		this.advancedSettingsDiv.createEl("h3", { text: "OpenAI Whisper Transcription" });
		this.addOpenAIEnabled();
		this.addOpenAIApiKey();
		this.addOpenAIModel();
		this.addOpenAIMaxFileSize();
		this.addOpenAITimeout();
		this.addOpenAIShowCostEstimate();
	}

	addHeader() {
		this.contentEl.empty();
		this.advancedSettingsDiv = this.contentEl.createDiv();
		this.titleEl.setText("Advanced settings");
	}

	addMessageDelimiterSetting() {
		new Setting(this.advancedSettingsDiv)
			.setName(`Default delimiter "***" between messages`)
			.setDesc("Turn off for using a custom delimiter, which you can set in the template file")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.defaultMessageDelimiter);
				toggle.onChange(async (value) => {
					this.plugin.settings.defaultMessageDelimiter = value;
					await this.plugin.saveSettings();
				});
			});
	}

	addParallelMessageProcessing() {
		new Setting(this.advancedSettingsDiv)
			.setName(`Parallel message processing`)
			.setDesc("Turn on for faster message and file processing. Caution: may disrupt message order")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.parallelMessageProcessing);
				toggle.onChange(async (value) => {
					this.plugin.settings.parallelMessageProcessing = value;
					await this.plugin.saveSettings();
				});
			});
	}

	addConnectionStatusIndicator() {
		new Setting(this.advancedSettingsDiv)
			.setName(connectionStatusIndicatorSettingName)
			.setDesc("Choose when you want to see the connection status indicator")
			.addDropdown((dropDown) => {
				dropDown.addOptions(ConnectionStatusIndicatorType);
				dropDown.setValue(this.plugin.settings.connectionStatusIndicatorType);
				dropDown.onChange(async (value) => {
					this.plugin.settings.connectionStatusIndicatorType = value as KeysOfConnectionStatusIndicatorType;
					this.plugin.connectionStatusIndicator?.update();
					await this.plugin.saveSettings();
				});
			});
	}

	addDeleteMessagesFromTelegram() {
		new Setting(this.advancedSettingsDiv)
			.setName("Delete messages from Telegram")
			.setDesc(
				"The Telegram messages will be deleted after processing them. If disabled, the Telegram messages will be marked as processed",
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.deleteMessagesFromTelegram);
				toggle.onChange(async (value) => {
					this.plugin.settings.deleteMessagesFromTelegram = value;
					await this.plugin.saveSettings();
				});
			});
	}

	addOpenAIEnabled() {
		new Setting(this.advancedSettingsDiv)
			.setName("Enable OpenAI Whisper transcription")
			.setDesc("Use OpenAI Whisper API to transcribe voice messages and audio files")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.openAiEnabled);
				toggle.onChange(async (value) => {
					this.plugin.settings.openAiEnabled = value;
					await this.plugin.saveSettings();
					// Refresh the display to show/hide API key field
					this.display();
				});
			});
	}

	addOpenAIApiKey() {
		// Only show API key field if OpenAI is enabled
		if (!this.plugin.settings.openAiEnabled) {
			return;
		}

		const apiKeySetting = new Setting(this.advancedSettingsDiv)
			.setName("OpenAI API key")
			.setDesc("Your OpenAI API key for Whisper transcription");

		// Create a password input field
		const inputEl = apiKeySetting.controlEl.createEl("input", {
			type: "password",
			placeholder: "sk-...",
			value: this.plugin.settings.openAiApiKey,
		});
		
		inputEl.style.width = "300px";
		
		inputEl.addEventListener("change", async (e) => {
			const target = e.target as HTMLInputElement;
			this.plugin.settings.openAiApiKey = target.value;
			await this.plugin.saveSettings();
		});

		// Add a show/hide button
		const toggleButton = apiKeySetting.controlEl.createEl("button", {
			text: "Show",
			cls: "mod-cta",
		});
		
		toggleButton.style.marginLeft = "10px";
		
		toggleButton.addEventListener("click", () => {
			if (inputEl.type === "password") {
				inputEl.type = "text";
				toggleButton.textContent = "Hide";
			} else {
				inputEl.type = "password";
				toggleButton.textContent = "Show";
			}
		});
	}

	addOpenAIModel() {
		if (!this.plugin.settings.openAiEnabled) {
			return;
		}

		new Setting(this.advancedSettingsDiv)
			.setName("Whisper model")
			.setDesc("OpenAI Whisper model to use (default: whisper-1)")
			.addText((text) => {
				text.setPlaceholder("whisper-1")
					.setValue(this.plugin.settings.openAiModel)
					.onChange(async (value) => {
						this.plugin.settings.openAiModel = value || "whisper-1";
						await this.plugin.saveSettings();
					});
			});
	}

	addOpenAIMaxFileSize() {
		if (!this.plugin.settings.openAiEnabled) {
			return;
		}

		new Setting(this.advancedSettingsDiv)
			.setName("Maximum file size (MB)")
			.setDesc("Maximum audio file size to transcribe (1-25 MB)")
			.addText((text) => {
				text.setPlaceholder("25")
					.setValue(String(this.plugin.settings.openAiMaxFileSize))
					.onChange(async (value) => {
						const size = parseInt(value) || 25;
						// Clamp between 1 and 25
						this.plugin.settings.openAiMaxFileSize = Math.max(1, Math.min(25, size));
						await this.plugin.saveSettings();
					});
			});
	}

	addOpenAITimeout() {
		if (!this.plugin.settings.openAiEnabled) {
			return;
		}

		new Setting(this.advancedSettingsDiv)
			.setName("Transcription timeout (seconds)")
			.setDesc("Maximum time to wait for transcription (10-120 seconds)")
			.addText((text) => {
				text.setPlaceholder("60")
					.setValue(String(this.plugin.settings.openAiTimeout))
					.onChange(async (value) => {
						const timeout = parseInt(value) || 60;
						// Clamp between 10 and 120
						this.plugin.settings.openAiTimeout = Math.max(10, Math.min(120, timeout));
						await this.plugin.saveSettings();
					});
			});
	}

	addOpenAIShowCostEstimate() {
		if (!this.plugin.settings.openAiEnabled) {
			return;
		}

		new Setting(this.advancedSettingsDiv)
			.setName("Show cost estimates")
			.setDesc("Display estimated costs for audio transcription ($0.006/minute)")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.openAiShowCostEstimate);
				toggle.onChange(async (value) => {
					this.plugin.settings.openAiShowCostEstimate = value;
					await this.plugin.saveSettings();
				});
			});
	}

	onOpen() {
		this.display();
	}
}
