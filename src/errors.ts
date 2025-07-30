export interface BaseError {
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
}

export interface DatabaseError extends BaseError {
  readonly code: "DATABASE_ERROR";
}

export interface DatabaseConnectionError extends BaseError {
  readonly code: "DATABASE_CONNECTION_ERROR";
}

export interface DuplicateTokenError extends BaseError {
  readonly code: "DUPLICATE_TOKEN_ERROR";
  readonly jti: string;
}

export interface InvalidTokenError extends BaseError {
  readonly code: "INVALID_TOKEN_ERROR";
}

export interface InvalidUrlError extends BaseError {
  readonly code: "INVALID_URL_ERROR";
  readonly url: string;
}

export interface EmbeddingError extends BaseError {
  readonly code: "EMBEDDING_ERROR";
}

export interface EmptyTextError extends BaseError {
  readonly code: "EMPTY_TEXT_ERROR";
}

export interface ScrapingError extends BaseError {
  readonly code: "SCRAPING_ERROR";
  readonly url: string;
}

export interface ContentExtractionError extends BaseError {
  readonly code: "CONTENT_EXTRACTION_ERROR";
  readonly url: string;
}

export type AppError =
  | DatabaseError
  | DatabaseConnectionError
  | DuplicateTokenError
  | InvalidTokenError
  | InvalidUrlError
  | EmbeddingError
  | EmptyTextError
  | ScrapingError
  | ContentExtractionError;

export const createDatabaseError = (
  message: string,
  cause?: unknown,
): DatabaseError => ({
  code: "DATABASE_ERROR",
  message,
  cause,
});

export const createDatabaseConnectionError = (
  message: string,
  cause?: unknown,
): DatabaseConnectionError => ({
  code: "DATABASE_CONNECTION_ERROR",
  message,
  cause,
});

export const createDuplicateTokenError = (
  jti: string,
): DuplicateTokenError => ({
  code: "DUPLICATE_TOKEN_ERROR",
  message: `Token with JTI '${jti}' already exists`,
  jti,
});

export const createInvalidTokenError = (
  cause?: unknown,
): InvalidTokenError => ({
  code: "INVALID_TOKEN_ERROR",
  message: "Invalid token",
  cause,
});

export const createInvalidUrlError = (url: string): InvalidUrlError => ({
  code: "INVALID_URL_ERROR",
  message: `Invalid URL format: ${url}`,
  url,
});

export const createEmbeddingError = (cause?: unknown): EmbeddingError => ({
  code: "EMBEDDING_ERROR",
  message: "Failed to generate embedding",
  cause,
});

export const createEmptyTextError = (): EmptyTextError => ({
  code: "EMPTY_TEXT_ERROR",
  message: "Text cannot be empty",
});

export const createScrapingError = (
  url: string,
  cause?: unknown,
): ScrapingError => ({
  code: "SCRAPING_ERROR",
  message: `Failed to scrape page`,
  url,
  cause,
});

export const createContentExtractionError = (
  url: string,
  cause?: unknown,
): ContentExtractionError => ({
  code: "CONTENT_EXTRACTION_ERROR",
  message: `Failed to extract content`,
  url,
  cause,
});
