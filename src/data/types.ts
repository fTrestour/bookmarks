export interface Bookmark {
  id: string;
  source_id: string;
  title: string;
  url: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  tags: string[];
  vector: number[];
}
