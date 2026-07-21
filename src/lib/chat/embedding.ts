/**
 * Postgres's pgvector columns/RPC params are `vector(768)` (see
 * `20260715000001_chat_memory_schema.sql`), which PostgREST represents over
 * the wire as its text literal form (`"[0.1,0.2,...]"`), not a JSON array —
 * confirmed by the real generated types (`database.types.ts`: `embedding`
 * and `p_query_embedding` are `string`, not `number[]`). Every
 * `AIClient.embedText()` result must go through this before an `.insert()`
 * or `.rpc()` call that touches a vector column/param.
 */
export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
