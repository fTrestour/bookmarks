# bookmarks

This project is a simple bookmark manager. It exposes an api to list and query bookmarks.

## Omnivore export

To ingest data from an omnivore export file, you can run the following query:

```bash
jq -R -s '[split("\n")[] | select(length > 0) | {url: . | gsub("^\"|\"$"; "")}]' <EXPORT_FILE> | curl -X POST -H "Content-Type: application/json" -d "@-" <BOOKMARKS_URL>/bookmarks/batch
```
