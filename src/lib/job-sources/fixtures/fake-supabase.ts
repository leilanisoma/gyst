/**
 * Minimal in-memory stand-in for the Supabase query builder, just enough to
 * exercise ingest.ts/run-discovery.ts's actual call patterns (select/eq/
 * ilike/in, insert/update, single/maybeSingle, and plain awaits for list
 * results) without a live database. Not a general-purpose mock.
 */
type Row = Record<string, unknown>;

// Mirrors the handful of `default` values ingest.ts/run-discovery.ts rely on
// the real schema to fill in (e.g. `opportunities.active` defaults to true).
const TABLE_DEFAULTS: Record<string, Row> = {
  opportunities: { active: true },
};

class FakeBuilder implements PromiseLike<{ data: unknown; error: { message: string } | null }> {
  private mode: "select" | "insert" | "update" = "select";
  private filters: ((row: Row) => boolean)[] = [];
  private insertRows?: Row[];
  private updateValues?: Row;

  constructor(
    private db: FakeSupabase,
    private table: string,
  ) {}

  select() {
    return this;
  }
  insert(values: Row | Row[]) {
    this.mode = "insert";
    this.insertRows = Array.isArray(values) ? values : [values];
    return this;
  }
  update(values: Row) {
    this.mode = "update";
    this.updateValues = values;
    return this;
  }
  eq(col: string, val: unknown) {
    this.filters.push((row) => row[col] === val);
    return this;
  }
  ilike(col: string, val: unknown) {
    this.filters.push((row) => String(row[col]).toLowerCase() === String(val).toLowerCase());
    return this;
  }
  in(col: string, vals: unknown[]) {
    this.filters.push((row) => vals.includes(row[col]));
    return this;
  }

  private rows(): Row[] {
    return (this.db.tables[this.table] ??= []);
  }

  private execute(): { data: Row[]; error: { message: string } | null } {
    const table = this.rows();
    if (this.mode === "insert") {
      const inserted = this.insertRows!.map((values) => {
        const row: Row = {
          id: `${this.table}-${this.db.nextId++}`,
          ...(TABLE_DEFAULTS[this.table] ?? {}),
          ...values,
        };
        table.push(row);
        return row;
      });
      return { data: inserted, error: null };
    }
    if (this.mode === "update") {
      const matched = table.filter((row) => this.filters.every((f) => f(row)));
      matched.forEach((row) => Object.assign(row, this.updateValues));
      return { data: matched, error: null };
    }
    return { data: table.filter((row) => this.filters.every((f) => f(row))), error: null };
  }

  then<TResult1, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  async maybeSingle() {
    const { data, error } = this.execute();
    return { data: data[0] ?? null, error };
  }

  async single() {
    const { data, error } = this.execute();
    return { data: data[0] ?? null, error: data.length > 0 ? error : { message: "not found" } };
  }
}

export class FakeSupabase {
  tables: Record<string, Row[]> = {};
  nextId = 1;

  from(table: string) {
    return new FakeBuilder(this, table);
  }
}
