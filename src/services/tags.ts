import { BookmarkRepository } from "../data/repository";

export interface TagCount {
  tag: string;
  count: number;
}

export class TagsService {
  constructor(private readonly repository: BookmarkRepository) {}

  async listTags(): Promise<TagCount[]> {
    return this.repository.getAllTags();
  }
}
