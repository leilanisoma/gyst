type InboxItem = {
  id: string;
  raw_text: string;
  created_at: string;
};

export function InboxList({ items }: { items: InboxItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing in the inbox. Capture a thought above.
      </p>
    );
  }

  return (
    <ul className="flex max-w-xl flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="border-border bg-card rounded-lg border p-3 text-sm"
        >
          <p className="whitespace-pre-wrap">{item.raw_text}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {new Date(item.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
