# Comment Fast - Complete Developer Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [Main Features](#main-features)
4. [Interaction Flow](#interaction-flow)
5. [Development Setup](#development-setup)
6. [Testing in Chrome](#testing-in-chrome)
7. [Publishing to Chrome Web Store](#publishing-to-chrome-web-store)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**Comment Fast** is a Chrome extension that uses AI to automatically generate high-quality, contextual comments for blog posts. It's designed for SEO link building by:
- Generating natural, relevant comments that reference specific article content
- Auto-detecting and matching the article's language
- Managing your domains for backlink tracking
- Making comments more likely to be approved by blog owners

**Tech Stack:**
- Framework: [Plasmo](https://www.plasmo.com/) (Chrome Extension Framework)
- Language: TypeScript + React
- AI: OpenRouter API (supports multiple AI models)
- Storage: Chrome Storage Sync API

---

## 📁 File Structure

```
comment-fast/
├── assets/
│   └── icon.png                 # Extension icon (512x512)
├── build/
│   └── chrome-mv3-dev/         # Development build output
├── node_modules/                # Dependencies
├── .plasmo/                     # Plasmo framework files (auto-generated)
├── background.ts                # Background service worker (API calls)
├── content.ts                   # Content script (page data extraction)
├── sidepanel.tsx                # Main UI (Home + Settings tabs)
├── package.json                 # Project configuration
├── tsconfig.json                # TypeScript configuration
├── pnpm-lock.yaml              # Dependency lock file
└── README.md                    # Basic documentation
```

### Core Files Explained

#### 1. `background.ts` (Background Service Worker)
- **Purpose:** Handles API communication with OpenRouter
- **Key Functions:**
  - Receives comment generation requests from UI
  - Builds smart prompts with article context
  - Calls OpenRouter API with user's model settings
  - Returns generated comments
  - Manages sidepanel behavior

#### 2. `content.ts` (Content Script)
- **Purpose:** Extracts blog article information from web pages
- **Key Functions:**
  - Runs on all web pages (`<all_urls>`)
  - Extracts: title, URL, content (2000 chars), article structure
  - Detects: main headings, key topics, introduction, code blocks
  - Responds to `GET_PAGE_CONTEXT` messages from UI

#### 3. `sidepanel.tsx` (User Interface)
- **Purpose:** Main extension UI with two tabs
- **Components:**
  - **Home Tab:** Generate comments, manage domains
  - **Settings Tab:** Configure API key, model, comment length
- **State Management:** React hooks + Chrome Storage

---

## ✨ Main Features

### 1. AI Comment Generation
- One-click generation based on current blog page
- Auto-detects article language (English, Chinese, Japanese, etc.)
- References specific article content (not generic)
- Configurable length: Short (30-50 words), Medium (50-100), Long (100-150)

### 2. Smart Content Analysis
- Extracts article structure: headings, introduction, code presence
- Analyzes key topics discussed
- Provides context to AI for relevant comments

### 3. Language Auto-Detection
- No manual language selection needed
- AI analyzes article content and responds in same language
- Supports any language (French, Spanish, German, Arabic, etc.)

### 4. Domain Management (SEO)
- Add your websites for backlink tracking
- Auto-extracts: description, markdown format, link text
- Store and manage multiple domains
- Easy copy/paste for link insertion

### 5. Flexible AI Configuration
- Choose any OpenRouter-compatible model
- Popular options: Claude 3 Haiku, GPT-4o Mini, etc.
- Adjust comment length preference
- Secure API key storage

---

## 🔄 Interaction Flow

### Comment Generation Flow:
```
1. User opens blog article
2. User clicks extension icon → sidepanel opens
3. User clicks "Generate Comment" on Home tab
   ↓
4. sidepanel.tsx sends "GET_PAGE_CONTEXT" message
   ↓
5. content.ts (running on page):
   - Extracts article title, URL, content
   - Analyzes structure (headings, intro, code)
   - Returns data to sidepanel
   ↓
6. sidepanel.tsx sends "GENERATE_COMMENT" to background
   ↓
7. background.ts:
   - Retrieves API key and model from storage
   - Builds smart prompt with article context
   - Calls OpenRouter API
   - Returns generated comment
   ↓
8. sidepanel.tsx displays comment
9. User clicks "Copy to Clipboard"
10. User pastes comment on blog
```

### Domain Management Flow:
```
1. User clicks + button in "My Domains" section
2. User enters domain (e.g., "example.com")
3. sidepanel.tsx:
   - Fetches domain's HTML
   - Parses <title> and <meta description>
   - Generates markdown: [Title](URL)
   - Saves to chrome.storage.sync
4. Domain card displayed with:
   - Domain name
   - Description
   - Markdown format
   - Link text
   - Delete button
```

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ installed
- pnpm installed: `npm install -g pnpm`
- Chrome browser
- OpenRouter API key: https://openrouter.ai/keys

### Installation
```bash
# Clone or navigate to project
cd comment-fast

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The dev server will:
- Watch for file changes
- Auto-rebuild extension
- Output to `build/chrome-mv3-dev/`
- Keep running in background

---

## 🧪 Testing in Chrome

### Step 1: Load Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. **Enable "Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"** button
4. Select folder: `/Users/bing/vercel/comment-fast/build/chrome-mv3-dev`
5. Extension appears in list with purple icon

### Step 2: Pin Extension to Toolbar

1. Click the puzzle icon (🧩) in Chrome toolbar
2. Find "DEV | Comment fast"
3. Click the pin icon to keep it visible

### Step 3: Configure Settings

1. Click extension icon → sidepanel opens on right
2. Go to **"Settings"** tab
3. Enter your **API Key** from OpenRouter
4. Set **Model** (e.g., `anthropic/claude-3-haiku-20240307`)
5. Choose **Comment Length** (Short/Medium/Long)
6. Click **"Save Settings"**
7. Wait for "Settings saved successfully" message

### Step 4: Test Comment Generation

1. Open any blog article in a new tab (e.g., https://dev.to)
2. Click extension icon
3. Go to **"Home"** tab
4. Click **"Generate Comment"** button
5. Wait 2-5 seconds
6. Generated comment appears below
7. Click **"Copy to Clipboard"**
8. Paste into blog comment box

### Step 5: Test Domain Management

1. In **"Home"** tab, scroll to "My Domains"
2. Click green **+** button
3. Enter domain: `yourdomain.com`
4. Click **"Add Domain"**
5. Wait for domain info to load
6. Verify: description, markdown, link text appear
7. Test delete by clicking red **×** button

### Step 6: Hot Reload Testing

When you edit code:
1. Save your changes
2. Extension auto-rebuilds (dev server running)
3. Go to `chrome://extensions/`
4. Click refresh icon (🔄) next to "DEV | Comment fast"
5. Test your changes

### Common Test Scenarios

#### Test Different Languages:
- English blog: https://dev.to
- Chinese blog: https://www.zhihu.com
- Japanese blog: https://qiita.com
- Verify comment matches article language

#### Test Different Article Types:
- Technical blog with code
- Personal blog post
- News article
- Tutorial with steps

#### Test Edge Cases:
- Very short articles
- Articles without clear structure
- Pages without `<article>` tag
- Non-blog pages (should still work)

---

## 📦 Publishing to Chrome Web Store

### Prerequisites
- Google Developer account ($5 one-time fee)
- Extension tested thoroughly
- Privacy policy prepared (if collecting data)
- Marketing images ready

### Step 1: Create Production Build

```bash
# Stop dev server (Ctrl+C)

# Create production build
pnpm build

# Output: build/chrome-mv3-prod/
```

### Step 2: Create ZIP Package

```bash
# Create package
pnpm package

# Output: build/comment-fast-0.0.1.zip
```

Or manually:
```bash
cd build/chrome-mv3-prod
zip -r ../comment-fast.zip *
```

### Step 3: Prepare Store Listing Materials

#### Required Images:
1. **Small Icon (128x128)** - Already generated in `assets/icon.png`
2. **Screenshots (1280x800 or 640x400)** - Take 3-5 screenshots:
   - Home tab with generated comment
   - Settings tab
   - My Domains section
   - Extension in action on blog

#### Required Text:
1. **Description** (up to 132 chars):
   ```
   AI-powered comment generator for blogs. Auto-detects language, references article content, and helps with SEO backlinks.
   ```

2. **Detailed Description** (full description):
   ```
   Comment Fast uses AI to generate high-quality, contextual comments for blog articles.

   Features:
   • Auto-detects article language and responds accordingly
   • References specific article content (not generic)
   • Configurable comment length
   • Domain management for SEO backlinks
   • Supports any OpenRouter AI model

   How it works:
   1. Browse to any blog article
   2. Click the extension icon
   3. Click "Generate Comment"
   4. Copy and paste the AI-generated comment

   Perfect for:
   • Building quality backlinks
   • Engaging with blog communities
   • Saving time on thoughtful responses

   Requires OpenRouter API key (free tier available).
   ```

3. **Privacy Policy** (if collecting data):
   - Host on your website or use Google Docs
   - State: "No user data collected or transmitted except API calls to OpenRouter"

4. **Category:** Productivity
5. **Language:** English

### Step 4: Submit to Chrome Web Store

1. Go to: https://chrome.google.com/webstore/devconsole
2. Pay $5 developer registration fee (one-time)
3. Click **"New Item"**
4. Upload ZIP file: `build/comment-fast-0.0.1.zip`
5. Fill in store listing:
   - Product name: "Comment Fast"
   - Summary
   - Detailed description
   - Category: Productivity
   - Language: English
6. Upload screenshots and icon
7. Set **Visibility**: Public / Unlisted / Private
8. Click **"Submit for Review"**

### Step 5: Wait for Review

- **Review time:** 1-3 days typically
- Check email for approval/rejection
- If rejected, fix issues and resubmit

### Step 6: Publish Updates

When you make changes:
```bash
# Update version in package.json
"version": "0.0.2"

# Build and package
pnpm build
pnpm package

# Go to Chrome Web Store Developer Console
# Upload new ZIP
# Submit for review
```

### Versioning Guidelines:
- **0.0.x** → Bug fixes
- **0.x.0** → New features
- **x.0.0** → Major changes

---

## 🐛 Troubleshooting

### Issue: Extension doesn't load

**Symptoms:** Error when loading unpacked extension

**Solutions:**
1. Check that you selected `build/chrome-mv3-dev` folder (not root)
2. Run `pnpm dev` to ensure build exists
3. Check console for build errors
4. Try: `rm -rf build && pnpm dev`

### Issue: "Missing API Key in settings"

**Symptoms:** Error when clicking "Generate Comment"

**Solutions:**
1. Go to Settings tab
2. Enter OpenRouter API key
3. Click "Save Settings"
4. Verify success message appears

### Issue: "Failed to get page context"

**Symptoms:** Cannot extract article info

**Solutions:**
1. Refresh the blog page
2. Check if content script loaded: Open DevTools → Console
3. Try a different blog site
4. Some sites block content scripts (e.g., chrome:// pages)

### Issue: Generated comment is in wrong language

**Symptoms:** English comment on Chinese blog

**Solutions:**
1. Ensure article has sufficient text (not just images)
2. Try regenerating
3. Check if blog actually has text in that language
4. AI sometimes defaults to English for very short content

### Issue: Domain fetch fails

**Symptoms:** "Failed to fetch domain info"

**Solutions:**
1. Check if domain is accessible (try opening in browser)
2. Some sites block cross-origin requests
3. Try with `https://` prefix
4. Check CORS restrictions

### Issue: Sidepanel doesn't open

**Symptoms:** Clicking icon does nothing

**Solutions:**
1. Right-click icon → "Open side panel"
2. Check if background script is running: `chrome://extensions/` → Click "service worker"
3. Reload extension
4. Restart Chrome

### Issue: Changes not reflecting

**Symptoms:** Code edits don't appear

**Solutions:**
1. Ensure dev server is running (`pnpm dev`)
2. Go to `chrome://extensions/`
3. Click refresh icon (🔄) next to extension
4. Hard refresh: Remove and reload extension

### Debugging Tips:

**View Background Script Logs:**
```
1. Go to chrome://extensions/
2. Find "DEV | Comment fast"
3. Click "service worker" link
4. Console opens with background.ts logs
```

**View Content Script Logs:**
```
1. Open blog page
2. Press F12 (DevTools)
3. Console tab shows content.ts logs
```

**View Sidepanel Logs:**
```
1. Open sidepanel
2. Right-click anywhere in sidepanel
3. Click "Inspect"
4. Console tab shows sidepanel.tsx logs
```

**Check Storage Data:**
```javascript
// In DevTools console:
chrome.storage.sync.get(null, (data) => console.log(data))
```

**Clear Storage Data:**
```javascript
// In DevTools console:
chrome.storage.sync.clear(() => console.log('Cleared'))
```

---

## 📚 Additional Resources

- **Plasmo Documentation:** https://docs.plasmo.com/
- **Chrome Extension Docs:** https://developer.chrome.com/docs/extensions/
- **OpenRouter API:** https://openrouter.ai/docs
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/

---

## 🎓 Learning Path for Chrome Extension Development

### Beginner:
1. Understand Chrome Extension architecture (background, content, popup/sidepanel)
2. Learn message passing between components
3. Study Chrome Storage API
4. Practice with Plasmo examples

### Intermediate:
1. Master TypeScript + React
2. Understand Manifest V3 requirements
3. Learn Chrome APIs (tabs, storage, runtime)
4. Debug using DevTools

### Advanced:
1. Optimize performance
2. Handle edge cases
3. Implement analytics (respect privacy)
4. A/B testing

---

## 📧 Support

If you encounter issues not covered here:
1. Check Plasmo Discord: https://discord.gg/plasmo
2. Chrome Extension GitHub Discussions
3. Stack Overflow with tag `chrome-extension`

---

**Happy Coding! 🚀**

