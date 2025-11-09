# Privacy Policy for Comment Fast

**Last Updated**: November 9, 2025

## Overview

Comment Fast is committed to protecting your privacy. This extension does not collect, store, or transmit any personal data to external servers operated by us.

## Data Collection

**We DO NOT collect any data.**

Specifically:
- We do not collect any personal information
- We do not track your browsing history
- We do not collect analytics or usage statistics
- We do not store any data on external servers
- We do not share any information with third parties

## Local Data Storage

Comment Fast uses Chrome's built-in storage API to store your settings locally on your device:

- **API Keys**: Your OpenRouter and CapSolver API keys (optional) are stored locally using Chrome's secure storage
- **User Preferences**: Settings like comment length, AI model selection
- **Domain List**: Your saved domains for quick access

All this data remains on your device and is never transmitted to our servers (we don't have any servers).

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
- **Privacy Policy**: https://www.capsolver.com/privacy-policy

### 3. Ahrefs (https://ahrefs.com)
- **Purpose**: Fetch publicly available backlinks data
- **When Used**: Only when you use the backlinks checker feature
- **Data Sent**: Domain name, verified tokens from CapSolver
- **Data Type**: Publicly available information only
- **Privacy Policy**: https://ahrefs.com/privacy

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
- No data is transmitted to servers controlled by us
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
- GitHub: https://github.com/brice94/comment-fast (please open an issue)
- Email: [your-email@example.com]

## Open Source

Comment Fast is open source. You can review the complete source code to verify our privacy practices:
- Repository: https://github.com/brice94/comment-fast

## Consent

By using Comment Fast, you consent to this privacy policy.

