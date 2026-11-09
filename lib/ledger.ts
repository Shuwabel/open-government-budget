import type { Block, BlockType } from "./types"

/**
 * A small hash-chained ledger. Every entry stores the SHA-256 of its own
 * contents plus the hash of the entry before it. Change anything in an old
 * entry and its hash no longer matches, and every later link breaks too.
 *
 * This is a teaching model that runs in the browser. It is not a blockchain
 * network: there are no peers, no consensus and no wallet.
 */

export const GENESIS_PREV = "0".repeat(64)

/** JSON with sorted keys, so the same data always hashes the same way. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null"
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(",")}}`
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

type HashInput = Pick<Block, "index" | "timestamp" | "type" | "actor" | "payload" | "prevHash">

export function blockPreimage(b: HashInput): string {
  return canonicalize({
    index: b.index,
    timestamp: b.timestamp,
    type: b.type,
    actor: b.actor,
    payload: b.payload,
    prevHash: b.prevHash,
  })
}

export function computeHash(b: HashInput): Promise<string> {
  return sha256Hex(blockPreimage(b))
}

export async function createBlock(
  prev: Block | null,
  input: { type: BlockType; actor: string; payload: Record<string, unknown>; timestamp: string },
): Promise<Block> {
  const base: HashInput = {
    index: prev ? prev.index + 1 : 0,
    timestamp: input.timestamp,
    type: input.type,
    actor: input.actor,
    payload: input.payload,
    prevHash: prev ? prev.hash : GENESIS_PREV,
  }
  return { ...base, hash: await computeHash(base) }
}

export interface ChainReport {
  ok: boolean
  checked: number
  /** Index of the first entry that fails, if any. */
  brokenAt: number | null
  reason: "content-changed" | "link-broken" | null
}

export async function verifyChain(blocks: Block[]): Promise<ChainReport> {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const expectedPrev = i === 0 ? GENESIS_PREV : blocks[i - 1].hash
    if (b.prevHash !== expectedPrev) {
      return { ok: false, checked: i, brokenAt: i, reason: "link-broken" }
    }
    if ((await computeHash(b)) !== b.hash) {
      return { ok: false, checked: i, brokenAt: i, reason: "content-changed" }
    }
  }
  return { ok: true, checked: blocks.length, brokenAt: null, reason: null }
}

export type EntryCheck =
  | { state: "not-found" }
  | { state: "verified" | "altered"; block: Block; recomputed: string; previous: Block | null; next: Block | null }

/** Look an entry up by full hash or a prefix of at least 8 hex characters. */
export function findBlock(blocks: Block[], query: string): Block | null {
  const q = query.trim().toLowerCase().replace(/^0x/, "")
  if (q.length < 8 || !/^[0-9a-f]+$/.test(q)) return null
  return blocks.find((b) => b.hash.startsWith(q)) ?? null
}

export async function checkEntry(blocks: Block[], query: string): Promise<EntryCheck> {
  const block = findBlock(blocks, query)
  if (!block) return { state: "not-found" }
  const recomputed = await computeHash(block)
  const previous = block.index > 0 ? (blocks[block.index - 1] ?? null) : null
  const next = blocks[block.index + 1] ?? null
  const linked = block.prevHash === (previous ? previous.hash : GENESIS_PREV)
  return {
    state: recomputed === block.hash && linked ? "verified" : "altered",
    block,
    recomputed,
    previous,
    next,
  }
}

export const shortHash = (h: string, n = 8) => (h.length > n * 2 ? `${h.slice(0, n)}…${h.slice(-4)}` : h)
