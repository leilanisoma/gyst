import type { AdapterId, JobSourceAdapter } from "./types";
import { greenhouseAdapter } from "./greenhouse";
import { leverAdapter } from "./lever";
import { curatedFeedAdapter } from "./curated-feed";

const ADAPTERS: Record<AdapterId, JobSourceAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  curated_feed: curatedFeedAdapter,
};

export function getAdapter(id: AdapterId): JobSourceAdapter {
  return ADAPTERS[id];
}
