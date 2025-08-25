# Data Layer Coding Rules

This folder contains the data layer of the application, responsible for database connections and data access patterns.

## File Organization

### database.ts

- **Purpose**: Database connection management only
- **Contains**: Database initialization, connection setup, migration logic
- **Exports**: `getDb()` function for obtaining database instances
- **Rules**:
  - MUST NOT contain query functions
  - MUST NOT contain business logic
  - Focus solely on connection lifecycle management

### \*.queries.ts Files

- **Purpose**: Data access functions organized by entity
- **Pattern**: `[entity].queries.ts` (e.g., `bookmarks.queries.ts`, `active-token.queries.ts`)
- **Contains**: sql queries for the entity
- **Rules**:
  - All functions MUST use `getDb()` from `database.ts`
  - All functions MUST return `Result<T, AppError>` using neverthrow pattern
  - All database return objects MUST be validated using Zod schemas from `@src/types.ts`
  - Create new schemas in `@src/types.ts` if needed for specific database return types
  - Functions should be pure database operations without business logic

## Coding Standards

### Error Handling

- Use neverthrow's `Result<T, E>` pattern for all database operations
- Import error creation functions from `@src/errors.ts`
- Return appropriate error types (DatabaseError, DatabaseConnectionError, etc.)
- Create new error types in `@src/errors.ts` if needed for specific database operations

### Type Safety

- Always validate database results with Zod schemas from `@src/types.ts`
- Consider creating new schemas in `@src/types.ts` when none is matching the database return type

### Function Patterns

```typescript
export async function functionName(params: Type) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const database = dbResult.value;

  try {
    // Database operation here
    const result = await database.operation();

    // Validate with Zod schema if returning data
    const validatedResult = schema.parse(result);
    return ok(validatedResult);
  } catch (error) {
    return err(
      createDatabaseError(
        `Failed to operation: ${error instanceof Error ? error.message : "Unknown error"}`,
        error,
      ),
    );
  }
}
```

### Performance

- Batch related database operations when possible
- Consider using transactions for multi-step operations
