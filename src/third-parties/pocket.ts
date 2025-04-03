import { BookmarksService } from "../services/bookmarks";

interface PocketItem {
  item_id: string;
  resolved_title: string;
  resolved_url: string;
  excerpt: string;
  time_added: string;
  tags?: Record<string, { tag: string }>;
}

interface PocketResponse {
  list: Record<string, PocketItem>;
  status: number;
  complete: number;
  error: string | null;
}

export class PocketService {
  constructor(
    private bookmarkService: BookmarksService,
    private consumerKey: string,
    private accessToken: string
  ) {}

  async syncFavorites(since?: Date): Promise<number> {
    const response = await fetch("https://getpocket.com/v3/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Accept": "application/json",
      },
      body: JSON.stringify({
        consumer_key: this.consumerKey,
        access_token: this.accessToken,
        favorite: "1",
        since: since?.toISOString(),
        detailType: "complete",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Pocket: ${response.statusText}`);
    }

    const data = (await response.json()) as PocketResponse;
    if (data.error) {
      throw new Error(`Pocket API error: ${data.error}`);
    }

    let created = 0;
    for (const item of Object.values(data.list)) {
      try {
        const tags = item.tags
          ? Object.values(item.tags).map((tag) => tag.tag)
          : [];

        await this.bookmarkService.createBookmark(
          item.resolved_title,
          item.resolved_url,
          item.excerpt,
          tags,
          item.item_id
        );
        created++;
      } catch (error) {
        if (
          // FIXME: The predicate seems a bit brittle
          error instanceof Error &&
          error.message.includes(
            "UNIQUE constraint failed: bookmarks.source_id"
          )
        ) {
          console.log(
            `Bookmark "${item.resolved_title}" already exists, skipping...`
          );
        } else {
          console.error(
            `Failed to process bookmark ${item.resolved_title}:`,
            error
          );
        }
      }
    }

    return created;
  }
}
