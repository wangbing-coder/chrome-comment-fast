import assert from "node:assert/strict"
import test from "node:test"

import { getBlockReason } from "../domainBlocklist"

test("getBlockReason skips big sites, including country suffixes", () => {
  assert.equal(getBlockReason("facebook.com"), "big-site")
  assert.equal(getBlockReason("lifehacker.com"), "big-site")
  assert.equal(getBlockReason("google.co.uk"), "big-site")
  assert.equal(getBlockReason("amazon.de"), "big-site")
})

test("getBlockReason flags gray-market patterns", () => {
  assert.equal(getBlockReason("kazino-1xbet-az.com"), "spam")
  assert.equal(getBlockReason("bestseotools.com"), "spam")
  assert.equal(getBlockReason("buybacklinks.net"), "spam")
  assert.equal(getBlockReason("slotgacor.com"), "spam")
  assert.equal(getBlockReason("vipleague.pm"), "spam")
  assert.equal(getBlockReason("69v.top"), "spam")
  assert.equal(getBlockReason("abc123.com"), "spam")
  assert.equal(getBlockReason("xn--80ak6aa92e.com"), "spam")
})

test("getBlockReason keeps ordinary domains", () => {
  assert.equal(getBlockReason("arderborelnot.com"), null)
  assert.equal(getBlockReason("museo.it"), null)
  assert.equal(getBlockReason("seoulfood.com"), null)
  assert.equal(getBlockReason("judicial.org"), null)
  assert.equal(getBlockReason("web3game.io"), null)
  assert.equal(getBlockReason("crazy-games.com"), null)
})
