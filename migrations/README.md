# Database Migrations

This directory contains all database migration scripts for the AI Calorie Tracker application. Migrations are managed using Drizzle ORM and follow specific conventions to ensure consistency and reliability.

## Migration Structure

- `*.sql` - Individual migration files
- `meta/` - Migration metadata and snapshots
- `meta/_journal.json` - Migration journal tracking applied migrations

## Migration Naming Convention

Migrations follow the pattern: `{sequence_number}_{description}.sql`

Example:
- `0001_create_users_table.sql`
- `0002_add_user_profile_fields.sql`

## Applying Migrations

Migrations are automatically applied when the application starts. The migration system tracks which migrations have been applied using the journal.

To manually apply migrations:
```bash
npm run migrate
```

## Creating New Migrations

1. Create a new migration file with the next sequence number
2. Write your SQL changes following MySQL syntax
3. Test the migration in a development environment
4. Commit the migration file

## Migration Best Practices

1. **One logical change per migration** - Keep migrations focused on a single change
2. **Use MySQL syntax** - Ensure all migrations use MySQL-specific syntax
3. **Add indexes** - Include appropriate indexes for query performance
4. **Test thoroughly** - Test both forward and rollback scenarios
5. **Document changes** - Add comments explaining complex operations

## Migration Safety

- Never modify existing migration files
- Always test migrations in development first
- Backup the database before applying migrations in production
- Monitor application logs after migration deployment

## Rolling Back Migrations

To rollback the last migration:
```bash
npm run migrate:down
```

Note: Not all migrations support rollback. Check the migration file for rollback instructions.

## Migration Testing

Migration tests are located in `server/src/tests/migration.test.ts` and verify:
- All migrations apply successfully
- Tables and indexes are created correctly
- Foreign key constraints are properly defined

Run migration tests:
```bash
npm run test:migrations
```

## Common Migration Patterns

### Adding a New Table
```sql
CREATE TABLE IF NOT EXISTS table_name (
  id INT AUTO_INCREMENT PRIMARY KEY,
  column_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Adding a New Column
```sql
ALTER TABLE table_name ADD COLUMN new_column VARCHAR(255) DEFAULT '';
```

### Adding an Index
```sql
CREATE INDEX idx_table_column ON table_name(column_name);
```

## Troubleshooting

### Migration Conflicts
If you encounter migration conflicts when merging branches:
1. Identify conflicting migration numbers
2. Rename your migration to use the next available number
3. Re-test the migration

### Failed Migrations
If a migration fails:
1. Check the error message for details
2. Fix the migration file
3. Rollback the failed migration
4. Re-apply the corrected migration

## Migration Journal

The `_journal.json` file tracks applied migrations. Each entry contains:
- `idx`: Migration sequence number
- `version`: Migration version
- `when`: Timestamp when applied
- `tag`: Migration filename
- `breakpoints`: Whether breakpoints are enabled

Never manually edit the journal file.

## Performance Considerations

- Add indexes for frequently queried columns
- Use appropriate data types to minimize storage
- Consider batch processing for large data migrations
- Monitor query performance after applying migrations

## Security Considerations

- Never store sensitive data in migration files
- Use environment variables for configuration
- Follow HIPAA compliance guidelines for PHI
- Limit database user permissions