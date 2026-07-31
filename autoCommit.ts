export type AutoCommitSite = {
  id: string
  name: string
  email: string
  website: string
  anchorTexts: string[]
}

export type AutoCommitLink = {
  id: string
  url: string
  domain: string
  title: string | null
  submitStatus: "pending" | "failed"
  submitCount: number
}

export const selectAnchor = (
  anchorTexts: string[],
  random: () => number = Math.random
) => {
  const values = anchorTexts.map((value) => value.trim()).filter(Boolean)
  if (values.length === 0) {
    throw new Error("The selected identity has no anchor text")
  }

  const index = Math.min(
    values.length - 1,
    Math.floor(random() * values.length)
  )
  return values[index]
}

export const typeTextWithSignals = async ({
  value,
  emitKeyDown,
  writeValue,
  emitInput,
  emitKeyUp,
  sleep = (milliseconds) =>
    new Promise<void>((resolve) => setTimeout(resolve, milliseconds)),
  random = Math.random
}: {
  value: string
  emitKeyDown: (key: string) => void
  writeValue: (value: string) => void
  emitInput: () => void
  emitKeyUp: (key: string) => void
  sleep?: (milliseconds: number) => Promise<void>
  random?: () => number
}) => {
  let typedValue = ""

  for (const character of value) {
    emitKeyDown(character)
    typedValue += character
    writeValue(typedValue)
    emitInput()
    emitKeyUp(character)
    await sleep(12 + Math.floor(random() * 21))
  }
}

export const waitForSuccessfulProbe = async <T>({
  probe,
  timeoutMs,
  intervalMs,
  timeoutMessage,
  now = Date.now,
  sleep = (milliseconds) =>
    new Promise<void>((resolve) => setTimeout(resolve, milliseconds))
}: {
  probe: () => Promise<T>
  timeoutMs: number
  intervalMs: number
  timeoutMessage: string
  now?: () => number
  sleep?: (milliseconds: number) => Promise<void>
}): Promise<T> => {
  const deadline = now() + timeoutMs
  let lastError: unknown

  while (now() < deadline) {
    try {
      return await probe()
    } catch (error) {
      lastError = error
    }

    const remainingMs = deadline - now()
    if (remainingMs <= 0) break
    await sleep(Math.min(intervalMs, remainingMs))
  }

  const detail =
    lastError instanceof Error
      ? lastError.message
      : lastError
        ? String(lastError)
        : ""
  throw new Error(`${timeoutMessage}${detail ? `: ${detail}` : ""}`)
}

export const urlsReferToSamePage = (first: string, second: string) => {
  try {
    const normalize = (value: string) => {
      const url = new URL(value)
      return `${url.origin}${url.pathname.replace(/\/+$/g, "") || "/"}`
    }
    return normalize(first) === normalize(second)
  } catch {
    return first === second
  }
}
