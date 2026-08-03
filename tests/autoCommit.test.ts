import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  addLinkAfterSuccessfulFill,
  selectAnchor,
  typeTextWithSignals,
  urlsReferToSamePage,
  waitForSuccessfulProbe
} from "../autoCommit"
import {
  fetchWithNetworkRetry,
  parseLinkManagerResponse
} from "../autoCommitClient"

test("addLinkAfterSuccessfulFill saves only after the form was filled", async () => {
  const calls: string[] = []
  const result = await addLinkAfterSuccessfulFill({
    fill: async () => {
      calls.push("fill")
      return { success: true, prepared: true }
    },
    addLink: async () => {
      calls.push("add")
      return { status: "created" as const, id: "link-1" }
    }
  })

  assert.deepEqual(calls, ["fill", "add"])
  assert.deepEqual(result, { status: "created", id: "link-1" })
})

test("addLinkAfterSuccessfulFill does not save a failed fill", async () => {
  let addCalls = 0

  await assert.rejects(
    () =>
      addLinkAfterSuccessfulFill({
        fill: async () => ({ success: false, error: "form missing" }),
        addLink: async () => {
          addCalls += 1
          return { status: "created" as const, id: "link-1" }
        }
      }),
    /form missing/
  )
  assert.equal(addCalls, 0)
})

test("Link Manager HTML responses report an undeployed API route", () => {
  assert.throws(
    () =>
      parseLinkManagerResponse(
        "<!DOCTYPE html><html><body>Link Manager</body></html>",
        "text/html; charset=utf-8"
      ),
    /backend API route may not be deployed/i
  )
})

test("Link Manager retries one transient network failure", async () => {
  let attempts = 0
  const response = await fetchWithNetworkRetry(
    async () => {
      attempts += 1
      if (attempts === 1) throw new TypeError("Failed to fetch")
      return new Response('{"ok":true}', {
        headers: { "content-type": "application/json" }
      })
    },
    async () => undefined
  )

  assert.equal(attempts, 2)
  assert.equal(response.status, 200)
})

test("selectAnchor uses the supplied random source", () => {
  assert.equal(
    selectAnchor(["first", "second", "third"], () => 0.5),
    "second"
  )
})

test("selectAnchor rejects an empty anchor list", () => {
  assert.throws(() => selectAnchor([], () => 0), /anchor text/i)
})

test("waitForSuccessfulProbe continues after transient page readiness errors", async () => {
  let attempts = 0
  let elapsed = 0

  const result = await waitForSuccessfulProbe({
    probe: async () => {
      attempts += 1
      if (attempts < 3) throw new Error("content script is not ready")
      return "ready"
    },
    timeoutMs: 1000,
    intervalMs: 100,
    now: () => elapsed,
    sleep: async (milliseconds) => {
      elapsed += milliseconds
    },
    timeoutMessage: "Page did not become readable"
  })

  assert.equal(result, "ready")
  assert.equal(attempts, 3)
})

test("waitForSuccessfulProbe reports the last readiness error on timeout", async () => {
  let elapsed = 0

  await assert.rejects(
    () =>
      waitForSuccessfulProbe({
        probe: async () => {
          throw new Error("Receiving end does not exist")
        },
        timeoutMs: 200,
        intervalMs: 100,
        now: () => elapsed,
        sleep: async (milliseconds) => {
          elapsed += milliseconds
        },
        timeoutMessage: "Page did not become readable"
      }),
    /Page did not become readable: Receiving end does not exist/
  )
})

test("urlsReferToSamePage tolerates redirects that only add a trailing slash", () => {
  assert.equal(
    urlsReferToSamePage(
      "https://example.com/article",
      "https://example.com/article/"
    ),
    true
  )
  assert.equal(
    urlsReferToSamePage(
      "https://example.com/first",
      "https://example.com/second"
    ),
    false
  )
})

test("typeTextWithSignals emits key events around each incremental value", async () => {
  const events: string[] = []

  await typeTextWithSignals({
    value: "ab",
    emitKeyDown: (key) => events.push(`down:${key}`),
    writeValue: (value) => events.push(`value:${value}`),
    emitInput: () => events.push("input"),
    emitKeyUp: (key) => events.push(`up:${key}`),
    sleep: async (milliseconds) => {
      events.push(`sleep:${milliseconds}`)
    },
    random: () => 0
  })

  assert.deepEqual(events, [
    "down:a",
    "value:a",
    "input",
    "up:a",
    "sleep:12",
    "down:b",
    "value:ab",
    "input",
    "up:b",
    "sleep:12"
  ])
})

test("manual preparation never submits forms or reports a submission", () => {
  const contentSource = readFileSync(
    new URL("../content.ts", import.meta.url),
    "utf8"
  )
  const backgroundSource = readFileSync(
    new URL("../background.ts", import.meta.url),
    "utf8"
  )
  const clientSource = readFileSync(
    new URL("../autoCommitClient.ts", import.meta.url),
    "utf8"
  )

  assert.match(contentSource, /AUTO_COMMIT_FILL_ONLY/)
  assert.doesNotMatch(contentSource, /submit\.click\(\)|form\.requestSubmit/)
  assert.doesNotMatch(backgroundSource, /reportAutoCommitSubmission/)
  assert.doesNotMatch(backgroundSource, /AUTO_COMMIT_FILL_AND_SUBMIT/)
  assert.match(
    backgroundSource,
    /PREPARE_CURRENT_PAGE_AND_ADD[\s\S]*chrome\.tabs\.query\([\s\S]*active:\s*true/
  )
  assert.doesNotMatch(clientSource, /\/submitted|reportAutoCommitSubmission/)
})
