# Technical Stack

> Last Updated: 2025-07-22
> Version: 1.0.0

## Core Technologies

### Application Framework

- **Framework:** Obsidian Plugin API
- **Version:** Latest
- **Language:** TypeScript

### Database

- **Primary:** Local file system (Obsidian vault)
- **Version:** N/A
- **ORM:** N/A (Direct file operations)

## Frontend Stack

### JavaScript Framework

- **Framework:** Vanilla TypeScript (Obsidian plugin architecture)
- **Version:** TypeScript 4.7.4
- **Build Tool:** esbuild 0.17.3

### Import Strategy

- **Strategy:** Node.js modules
- **Package Manager:** npm
- **Node Version:** 16+ (based on types)

### CSS Framework

- **Framework:** Custom CSS with Obsidian theming
- **Version:** N/A
- **PostCSS:** No

### UI Components

- **Library:** Obsidian native UI components
- **Version:** Latest Obsidian API
- **Installation:** Via Obsidian plugin API

## Assets & Media

### Fonts

- **Provider:** Obsidian defaults
- **Loading Strategy:** Inherited from Obsidian app

### Icons

- **Library:** Obsidian built-in icons
- **Implementation:** CSS classes and Obsidian API

## Infrastructure

### Application Hosting

- **Platform:** Local desktop application
- **Service:** Obsidian Electron app
- **Region:** User's local machine

### Database Hosting

- **Provider:** Local file system
- **Service:** User's Obsidian vault
- **Backups:** User-managed

### Asset Storage

- **Provider:** Local file system
- **CDN:** N/A
- **Access:** Direct file access

## External Services

### Telegram Integration

- **API:** node-telegram-bot-api v0.66.0
- **Client:** telegram v2.25.11
- **Authentication:** Bot token

### Additional Libraries

- **QR Code Generation:** qrcode v1.5.3
- **Link Detection:** linkify-it v4.0.1
- **MIME Type Detection:** mime-types v2.1.35
- **Machine ID:** node-machine-id v1.1.12
- **Version Comparison:** compare-versions v6.1.0

## Development Tools

### Linting & Formatting

- **Linter:** ESLint 8.47.0
- **Parser:** @typescript-eslint/parser 5.29.0
- **Formatter:** Prettier (latest)
- **Config:** eslint-config-prettier

### Testing

- **Framework:** None currently configured
- **Runner:** N/A
- **Coverage:** N/A

## Deployment

### CI/CD Pipeline

- **Platform:** GitHub Actions (release-please)
- **Trigger:** Version tagging and releases
- **Tests:** Linting and TypeScript compilation

### Distribution

- **Primary:** Obsidian Community Plugins
- **Secondary:** GitHub Releases
- **Package:** main.js, manifest.json, styles.css

### Environments

- **Production:** User's Obsidian installation
- **Development:** Local development with hot reload
- **Testing:** Manual testing in Obsidian

## Code Repository

- **URL:** https://github.com/soberhacker/obsidian-telegram-sync