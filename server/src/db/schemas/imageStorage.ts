import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, boolean, decimal, text, json, mysqlTable } from 'drizzle-orm/mysql-core';

// Image Metadata Table
export const imageMetadata = mysqlTable('image_metadata', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  storedFilename: varchar('stored_filename', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: int('file_size').notNull(), // in bytes
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  width: int('width'),
  height: int('height'),
  fileSizeCompressed: int('file_size_compressed'), // in bytes
  compressionRatio: decimal('compression_ratio', { precision: 5, scale: 2 }), // percentage
  storageType: varchar('storage_type', { length: 20 }).default('local'), // 'local', 's3'
  isPublic: boolean('is_public').default(false),
  downloadCount: int('download_count').default(0),
  lastAccessed: timestamp('last_accessed'),
  expiresAt: timestamp('expires_at'),
  metadata: text('metadata'), // JSON string for additional metadata
  tags: text('tags'), // comma-separated tags
  category: varchar('category', { length: 50 }), // 'avatar', 'meal', 'profile', etc.
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Image Thumbnails Table
export const imageThumbnails = mysqlTable('image_thumbnails', {
  id: varchar('id', { length: 255 }).primaryKey(),
  imageId: varchar('image_id', { length: 255 }).notNull().references(() => imageMetadata.id),
  size: varchar('size', { length: 20 }).notNull(), // 'small', 'medium', 'large', 'thumbnail'
  width: int('width').notNull(),
  height: int('height').notNull(),
  fileSize: int('file_size').notNull(), // in bytes
  filePath: varchar('file_path', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  storageType: varchar('storage_type', { length: 20 }).default('local'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Image Processing Jobs Table
export const imageProcessingJobs = mysqlTable('image_processing_jobs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  imageId: varchar('image_id', { length: 255 }).notNull().references(() => imageMetadata.id),
  jobType: varchar('job_type', { length: 20 }).notNull(), // 'compress', 'resize', 'thumbnail', 'optimize'
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'processing', 'completed', 'failed'
  progress: int('progress').default(0), // 0-100 percentage
  errorMessage: text('error_message'),
  outputData: text('output_data'), // JSON string for job output
  priority: int('priority').default(5), // 1-10, higher is more important
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Image Albums Table
export const imageAlbums = mysqlTable('image_albums', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  coverImageId: varchar('cover_image_id', { length: 255 }).references(() => imageMetadata.id),
  isPublic: boolean('is_public').default(false),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Image Album Items Table
export const imageAlbumItems = mysqlTable('image_album_items', {
  id: varchar('id', { length: 255 }).primaryKey(),
  albumId: varchar('album_id', { length: 255 }).notNull().references(() => imageAlbums.id),
  imageId: varchar('image_id', { length: 255 }).notNull().references(() => imageMetadata.id),
  order: int('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Image Analytics Table
export const imageAnalytics = mysqlTable('image_analytics', {
  id: varchar('id', { length: 255 }).primaryKey(),
  imageId: varchar('image_id', { length: 255 }).notNull().references(() => imageMetadata.id),
  userId: int('user_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(), // 'view', 'download', 'share', 'like'
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Image Storage Quotas Table
export const imageStorageQuotas = mysqlTable('image_storage_quotas', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').unique().notNull(),
  totalQuota: int('total_quota').default(5 * 1024 * 1024 * 1024), // 5GB default
  usedQuota: int('used_quota').default(0),
  imageCount: int('image_count').default(0),
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Image Sharing Table
export const imageSharing = mysqlTable('image_sharing', {
  id: varchar('id', { length: 255 }).primaryKey(),
  imageId: varchar('image_id', { length: 255 }).notNull().references(() => imageMetadata.id),
  sharedBy: int('shared_by').notNull(),
  sharedWith: int('shared_with'), // null for public sharing
  accessType: varchar('access_type', { length: 20 }).default('view'), // 'view', 'download', 'edit'
  expiresAt: timestamp('expires_at'),
  isRevoked: boolean('is_revoked').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Image Moderation Table
export const imageModeration = mysqlTable('image_moderation', {
  id: varchar('id', { length: 255 }).primaryKey(),
  imageId: varchar('image_id', { length: 255 }).notNull().references(() => imageMetadata.id),
  moderatedBy: int('moderated_by'),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'approved', 'rejected', 'flagged'
  reason: text('reason'),
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 4 }), // 0-1
  moderationData: text('moderation_data'), // JSON string for moderation results
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Image Cache Table
export const imageCache = mysqlTable('image_cache', {
  id: varchar('id', { length: 255 }).primaryKey(),
  cacheKey: varchar('cache_key', { length: 255 }).unique(),
  imageId: varchar('image_id', { length: 255 }).notNull().references(() => imageMetadata.id),
  size: varchar('size', { length: 20 }).notNull(), // 'original', 'small', 'medium', 'large'
  data: text('data').notNull(), // Base64 encoded image data
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  hitCount: int('hit_count').default(0),
  lastAccessed: timestamp('last_accessed'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Create indexes for better performance
export const imageStorageIndexes = {
  imageMetadata_userId: sql`CREATE INDEX IF NOT EXISTS image_metadata_user_id_idx ON image_metadata(user_id)`,
  imageMetadata_mimeType: sql`CREATE INDEX IF NOT EXISTS image_metadata_mime_type_idx ON image_metadata(mime_type)`,
  imageMetadata_storageType: sql`CREATE INDEX IF NOT EXISTS image_metadata_storage_type_idx ON image_metadata(storage_type)`,
  imageMetadata_category: sql`CREATE INDEX IF NOT EXISTS image_metadata_category_idx ON image_metadata(category)`,
  imageMetadata_isDeleted: sql`CREATE INDEX IF NOT EXISTS image_metadata_is_deleted_idx ON image_metadata(is_deleted)`,
  imageMetadata_expiresAt: sql`CREATE INDEX IF NOT EXISTS image_metadata_expires_at_idx ON image_metadata(expires_at)`,
  imageThumbnails_imageId: sql`CREATE INDEX IF NOT EXISTS image_thumbnails_image_id_idx ON image_thumbnails(image_id)`,
  imageThumbnails_size: sql`CREATE INDEX IF NOT EXISTS image_thumbnails_size_idx ON image_thumbnails(size)`,
  imageProcessingJobs_imageId: sql`CREATE INDEX IF NOT EXISTS image_processing_jobs_image_id_idx ON image_processing_jobs(image_id)`,
  imageProcessingJobs_status: sql`CREATE INDEX IF NOT EXISTS image_processing_jobs_status_idx ON image_processing_jobs(status)`,
  imageProcessingJobs_priority: sql`CREATE INDEX IF NOT EXISTS image_processing_jobs_priority_idx ON image_processing_jobs(priority)`,
  imageAlbums_userId: sql`CREATE INDEX IF NOT EXISTS image_albums_user_id_idx ON image_albums(user_id)`,
  imageAlbums_isPublic: sql`CREATE INDEX IF NOT EXISTS image_albums_is_public_idx ON image_albums(is_public)`,
  imageAlbumItems_albumId: sql`CREATE INDEX IF NOT EXISTS image_album_items_album_id_idx ON image_album_items(album_id)`,
  imageAlbumItems_imageId: sql`CREATE INDEX IF NOT EXISTS image_album_items_image_id_idx ON image_album_items(image_id)`,
  imageAnalytics_imageId: sql`CREATE INDEX IF NOT EXISTS image_analytics_image_id_idx ON image_analytics(image_id)`,
  imageAnalytics_userId: sql`CREATE INDEX IF NOT EXISTS image_analytics_user_id_idx ON image_analytics(user_id)`,
  imageAnalytics_action: sql`CREATE INDEX IF NOT EXISTS image_analytics_action_idx ON image_analytics(action)`,
  imageAnalytics_timestamp: sql`CREATE INDEX IF NOT EXISTS image_analytics_timestamp_idx ON image_analytics(timestamp)`,
  imageStorageQuotas_userId: sql`CREATE INDEX IF NOT EXISTS image_storage_quotas_user_id_idx ON image_storage_quotas(user_id)`,
  imageSharing_imageId: sql`CREATE INDEX IF NOT EXISTS image_sharing_image_id_idx ON image_sharing(image_id)`,
  imageSharing_sharedWith: sql`CREATE INDEX IF NOT EXISTS image_sharing_shared_with_idx ON image_sharing(shared_with)`,
  imageSharing_accessType: sql`CREATE INDEX IF NOT EXISTS image_sharing_access_type_idx ON image_sharing(access_type)`,
  imageModeration_imageId: sql`CREATE INDEX IF NOT EXISTS image_moderation_image_id_idx ON image_moderation(image_id)`,
  imageModeration_status: sql`CREATE INDEX IF NOT EXISTS image_moderation_status_idx ON image_moderation(status)`,
  imageCache_cacheKey: sql`CREATE INDEX IF NOT EXISTS image_cache_cache_key_idx ON image_cache(cache_key)`,
  imageCache_expiresAt: sql`CREATE INDEX IF NOT EXISTS image_cache_expires_at_idx ON image_cache(expires_at)`,
  imageCache_hitCount: sql`CREATE INDEX IF NOT EXISTS image_cache_hit_count_idx ON image_cache(hit_count)`,
};