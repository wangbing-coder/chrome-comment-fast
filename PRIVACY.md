# Privacy Policy for Comment Fast

**Last Updated**: July 31, 2026

## Overview

Comment Fast does not include analytics or telemetry. It transmits data only
when needed for features the user invokes and to services configured by the
user.

## Data Collection

- We do not track browsing history or collect analytics.
- Link records can be loaded from and stored by the configured Link Manager.
- Article excerpts are sent to OpenRouter when generating a comment.
- Comment identity fields are filled into the selected website's form but are
  not submitted by the extension.

## Local Data Storage

Comment Fast uses Chrome's built-in storage API to store your settings locally on your device:

- **API Keys**: Your OpenRouter, CapSolver, and Auto Commit API credentials are stored using Chrome sync storage
- **User Preferences**: Settings like comment length, AI model selection
- **Domain List**: Your saved domains for quick access

Chrome may synchronize these settings through the browser profile. Credentials
are transmitted only to the corresponding configured service when a feature is
used.

## Third-Party Services

Comment Fast connects to third-party APIs only when you explicitly use certain features:

### 1. OpenRouter API (https://openrouter.ai)

- **Purpose**: Generate AI-powered comments
- **When Used**: Only when you click "Generate Comment"
- **Data Sent**: Article title, content snippet, and URL
- **Your Control**: Uses your own API key that you provide
- **Privacy Policy**: https://openrouter.ai/privacy

### 2. CapSolver API (https://capsolver.com)

- **Purpose**: Solve Cloudflare challenges for backlinks feature
- **When Used**: Only when you use the backlinks checker feature
- **Data Sent**: Domain name you're checking, Cloudflare challenge tokens
- **Your Control**: Optional feature, uses your own API key
- **Privacy Policy**: https://www.capsolver.com/privacy

### 3. Ahrefs (https://ahrefs.com)

- **Purpose**: Fetch publicly available backlinks data
- **When Used**: Only when you use the backlinks checker feature
- **Data Sent**: Domain name, verified tokens from CapSolver
- **Data Type**: Publicly available information only
- **Privacy Policy**: https://ahrefs.com/legal/privacy-policy

### 4. Configured Link Manager

- **Purpose**: Check/save links and load comment identities and queued links
- **When Used**: When Link Manager or comment preparation features are used
- **Data Sent**: URLs and link metadata
- **Your Control**: The server URL and Auto Commit token are configured in Settings

### 5. Target comment websites

- **Purpose**: Prepare a comment form for manual review and submission
- **Data Filled Locally**: Generated comment, selected anchor text as Name,
  identity email, and identity website
- **Your Control**: The extension does not submit the form; you decide whether
  to click the website's submit button

## Permissions Explained

Comment Fast requests the following permissions:

- **storage**: Store your settings and preferences locally on your device
- **tabs**: Get the URL of the current page for comment generation and backlinks checking
- **scripting**: Inject the UI panel into web pages
- **<all_urls>**: Allow the extension to work on any website where you want to generate comments

These permissions are used solely for the extension's functionality and not for data collection.

## Data Security

- All API keys are stored using Chrome's secure storage mechanism
- Data is encrypted at rest by Chrome
- Credentials are sent only to their configured service endpoints
- You have full control over your data

## Your Control

You can:

- Delete all stored data by uninstalling the extension
- Clear your API keys at any time in the Settings tab
- Use the extension without providing optional API keys (basic features still work)
- Review all code as this is an open-source project

## Children's Privacy

Comment Fast does not knowingly collect any information from children under 13. The extension is not directed at children.

## Changes to This Policy

We may update this privacy policy from time to time. We will notify users of any changes by updating the "Last Updated" date.

## Contact

If you have questions about this privacy policy, please contact:

- GitHub: https://github.com/wangbing-coder/chrome-comment-fast (please open an issue)
- Email: leobing2023@gmail.com

## Open Source

Comment Fast is open source. You can review the complete source code to verify our privacy practices:

- Repository: https://github.com/wangbing-coder/chrome-comment-fast

## Consent

By using Comment Fast, you consent to this privacy policy.
