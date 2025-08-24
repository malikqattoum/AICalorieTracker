# Database Migration Best Practices

This document outlines the best practices and standards for database migrations in the AI Calorie Tracker project.

## 1. Migration Principles

### 1.1. Version Control
- All migrations must be stored in version control
- Each migration should have a unique, sequential identifier
- Migration files should be immutable once committed to the main branch

### 1.2. Reversibility
- Every migration should have a clear rollback path
- Destructive operations (DROP, DELETE) should be carefully considered
- Always test rollback procedures in a development environment

### 1.3. Idempotency
- Migrations should be idempotent (safe to run multiple times)
- Use `IF NOT EXISTS` and `IF EXISTS` clauses where appropriate
- Check for existing data/columns before making changes

## 2. Migration Standards

### 2.1. File Naming Convention
- Use sequential numbering: `0001_description.sql`, `0002_description.sql`, etc.
- Descriptive names that clearly indicate the purpose of the migration
- Use snake_case for consistency

### 2.2. SQL Syntax Standards
- Use MySQL-specific syntax consistently
- Use appropriate data types (e.g., `INT AUTO_INCREMENT` instead of `SERIAL`)
- Use proper constraints and indexes
- Follow the existing schema naming conventions

### 2.3. Migration Structure
- Each migration should focus on a single logical change
- Include both forward and backward migration logic when possible
- Add comments to explain complex operations
- Group related changes within a single migration file

## 3. Performance Considerations

### 3.1. Indexing Strategy
- Add indexes for frequently queried columns
- Create composite indexes for multi-column queries
- Remove unused indexes to reduce write overhead
- Consider index impact on INSERT/UPDATE performance

### 3.2. Large Data Operations
- For large data migrations, use batch processing
- Avoid long-running transactions that lock tables
- Consider running heavy operations during off-peak hours
- Monitor performance during migration execution

### 3.3. Foreign Key Constraints
- Define foreign key relationships explicitly
- Ensure referential integrity between related tables
- Add indexes on foreign key columns for better join performance

## 4. Security Practices

### 4.1. Data Protection
- Never store sensitive data in migration files
- Use environment variables for configuration
- Encrypt sensitive data at rest
- Follow HIPAA compliance guidelines for PHI

### 4.2. Access Control
- Limit database user permissions to only what's necessary
- Use separate credentials for migrations vs. application access
- Rotate credentials regularly
- Audit migration execution logs

## 5. Testing and Validation

### 5.1. Pre-Migration Testing
- Test migrations in a development environment first
- Verify schema changes match expectations
- Check for data integrity after migration
- Validate application functionality with the new schema

### 5.2. Post-Migration Validation
- Verify all indexes and constraints are in place
- Check for any performance degradation
- Confirm data consistency across related tables
- Monitor application logs for errors

### 5.3. Automated Testing
- Include migration tests in the CI/CD pipeline
- Test both forward and rollback scenarios
- Validate database state after each migration
- Use database snapshots for faster test resets

## 6. Migration Process

### 6.1. Development Workflow
1. Create a new migration file with a unique sequence number
2. Write the migration SQL following established patterns
3. Test the migration locally
4. Add corresponding rollback logic
5. Update the migration journal
6. Commit and push for review

### 6.2. Deployment Process
1. Backup the database before running migrations
2. Run migrations in a staging environment first
3. Monitor for errors during migration execution
4. Validate application functionality after migration
5. Deploy application changes that depend on the new schema
6. Monitor production for any issues

### 6.3. Rollback Procedure
1. Identify the problematic migration
2. Execute the rollback script for that migration
3. Verify database state is consistent
4. Revert any application code changes if necessary
5. Document the issue and solution for future reference

## 7. Common Patterns

### 7.1. Adding a New Table
```sql
-- Create the table with appropriate columns and constraints
CREATE TABLE IF NOT EXISTS table_name (
  id INT AUTO_INCREMENT PRIMARY KEY,
  column_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_table_column ON table_name(column_name);
```

### 7.2. Adding a New Column
```sql
-- Add column with default value to avoid NULL issues
ALTER TABLE table_name ADD COLUMN new_column VARCHAR(255) DEFAULT '';

-- Add index if the column will be frequently queried
CREATE INDEX idx_table_new_column ON table_name(new_column);
```

### 7.3. Modifying Existing Columns
```sql
-- Always check if column exists before modifying
ALTER TABLE table_name MODIFY COLUMN column_name VARCHAR(500);
```

## 8. Troubleshooting

### 8.1. Common Issues
- Migration conflicts when merging branches
- Data type mismatches causing errors
- Missing foreign key constraints
- Performance issues with large datasets

### 8.2. Resolution Strategies
- Use database snapshots for quick rollback
- Break large migrations into smaller chunks
- Add monitoring and alerting for migration failures
- Maintain detailed migration documentation

## 9. Tools and Utilities

### 9.1. Drizzle ORM Migration Tools
- Use `drizzle-kit` for generating and managing migrations
- Leverage Drizzle's type safety features
- Use the migration CLI for consistent execution

### 9.2. Database Monitoring
- Monitor query performance before and after migrations
- Track database size and growth patterns
- Set up alerts for migration failures

## 10. Future Considerations

### 10.1. Scaling Strategies
- Plan for horizontal scaling if needed
- Consider partitioning large tables
- Implement read replicas for read-heavy workloads

### 10.2. Migration Automation
- Integrate migrations into CI/CD pipeline
- Implement automated rollback on failure
- Add pre-flight checks before migration execution