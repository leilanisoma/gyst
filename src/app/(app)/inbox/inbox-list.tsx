import { InboxItemRow } from "./inbox-item-row";

type InboxItem = {
  id: string;
  raw_text: string;
  created_at: string;
};

export function InboxList({
  items,
  aiExtractionEnabled,
}: {
  items: InboxItem[];
  aiExtractionEnabled: boolean;
}) {
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
        <InboxItemRow
          key={item.id}
          item={item}
          aiExtractionEnabled={aiExtractionEnabled}
        />
      ))}
    </ul>
  );
}
