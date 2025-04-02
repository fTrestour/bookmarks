export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  tags: string[];
  vector: Uint8Array;
}
