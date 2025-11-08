# Troubleshooting Guide

## "Could not establish connection" Error

If you see the error "Content script is not responding", follow these steps:

### Quick Fix

1. **Reload the Extension**
   - Open `chrome://extensions` in your browser
   - Find "Comment Fast" extension
   - Click the **Refresh icon (⟳)**

2. **Refresh the Webpage**
   - Go back to the webpage where you want to generate comments
   - Press **F5** (or **Cmd+R** on Mac) to refresh

3. **Verify Content Script is Loaded**
   - Press **F12** to open Developer Tools
   - Go to the **Console** tab
   - You should see: `✅ Comment Fast content script loaded on: [URL]`

4. **Try Generating Comment Again**
   - Click the extension icon to open the side panel
   - Click "Generate Comment"

### Why This Happens

Content scripts need to be injected when the page loads. If:
- You just installed/updated the extension
- The page was loaded before the extension was enabled
- You're in development mode and made code changes

...then the content script won't be present until you refresh both the extension and the page.

### Still Not Working?

**Check the page type:**
- Extensions cannot run on `chrome://`, `edge://`, `about:` pages
- Some websites have Content Security Policies that block extensions
- File URLs (`file://`) may need special permissions

**Verify in Console:**
If you don't see the "✅ Comment Fast content script loaded" message after refreshing, there might be:
- A JavaScript error preventing the script from loading
- CSP restrictions on the website
- The page type doesn't support extensions

**Check for Errors:**
Look in the Console for any red error messages that mention "Comment Fast" or "content script"

### Development Mode

If you're running the extension in development mode (`pnpm dev`):

1. Stop the dev server (Ctrl+C)
2. Run `pnpm build` to create a production build
3. Load the extension from `build/chrome-mv3-prod` directory
4. Refresh the webpage

## Other Common Issues

### "No API Key" Error
- Go to Settings tab
- Enter your OpenRouter API key from https://openrouter.ai/keys
- Click "Save Settings"

### "Failed to generate comment" Error
- Check your internet connection
- Verify your API key is correct and has credits
- Check the Console for detailed error messages

### Extension Icon Does Nothing
- Make sure you're on a regular webpage (not chrome://, file://, etc.)
- Check if the extension is enabled in `chrome://extensions`
- Look for errors in the extension's background page console

## Getting Help

If none of these solutions work:
1. Open an issue on GitHub with:
   - The exact error message
   - The website URL where it's failing
   - Screenshots of the Console
   - Whether you're using dev or prod build

