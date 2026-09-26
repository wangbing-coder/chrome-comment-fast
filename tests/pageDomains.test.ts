import assert from "node:assert/strict"
import test from "node:test"

import { groupLinksByDomain, toRegistrableDomain } from "../pageDomains"

test("toRegistrableDomain reduces hosts to eTLD+1", () => {
  assert.equal(
    toRegistrableDomain("https://blog.example.co.uk/x"),
    "example.co.uk"
  )
  assert.equal(toRegistrableDomain("www.example.com"), "example.com")
  assert.equal(toRegistrableDomain("http://127.0.0.1/"), null)
  assert.equal(toRegistrableDomain("localhost"), null)
  assert.equal(toRegistrableDomain("mailto:a@example.com"), null)
})

test("groupLinksByDomain merges subdomains and keeps anchors", () => {
  const groups = groupLinksByDomain(
    [
      { url: "https://a.example.com/1", text: "Alpha", source: "anchor" },
      { url: "https://www.example.com/2", text: "Alpha", source: "anchor" },
      { url: "https://other.io/", text: "", source: "text" },
      { url: "https://site.test/", text: "Self", source: "anchor" }
    ],
    "https://example.com/page"
  )

  const example = groups.find((group) => group.domain === "example.com")
  assert.ok(example)
  assert.equal(example.linkCount, 2)
  assert.deepEqual(example.anchors, ["Alpha"])
  assert.deepEqual(example.hosts, ["a.example.com", "www.example.com"])
  assert.equal(example.isCurrent, true)

  const other = groups.find((group) => group.domain === "other.io")
  assert.deepEqual(other?.sources, ["text"])
  assert.equal(
    groups.some((group) => group.domain === "site.test"),
    false
  )
})
