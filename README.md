# Comment Fast

Chrome MV3 extension for contextual comment generation, backlink checks, Link
Manager saves, and assisted WordPress comment preparation.

## Development

```bash
pnpm install
pnpm dev
```

Load `build/chrome-mv3-dev` as an unpacked extension from
`chrome://extensions`.

## Comment Preparation

Comment preparation opens selected WordPress articles in separate tabs,
extracts their content, generates a contextual comment, fills the standard
Name/Email/Website/Comment fields, and focuses the Comment input.

The extension never clicks the submit button. Review each prepared tab and
submit the comment manually.

1. In Link Manager, create an active comment identity and queue External Links
   from the Auto Commit page.
2. In the extension Settings tab, configure:
   - OpenRouter API key and model
   - Link Manager API URL
   - Auto Commit API token matching `AUTO_COMMIT_API_TOKEN` on Link Manager
3. Open the Prepare tab, choose an identity and up to 20 links, then click
   **Open & Fill**.

To add the article already open in the active tab, choose an identity and click
**Fill & Add to Links**. The extension adds or updates that domain in Link
Manager only after all comment fields are filled successfully. You still review
and submit the form manually.

The prepared tabs remain open. Preparation does not update the Link Manager
submission status because only the user controls the final submission.

## Verification

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

The production unpacked extension is generated at `build/chrome-mv3-prod`.
