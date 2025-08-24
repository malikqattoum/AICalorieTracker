-- Payment Tables
CREATE TABLE IF NOT EXISTS payment_intents (
    id TEXT PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'requires_payment_method',
    client_secret TEXT NOT NULL,
    payment_method_id TEXT,
    user_id INTEGER NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    last4 TEXT,
    brand TEXT,
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    provider_id TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'incomplete',
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    trial_end TIMESTAMP,
    canceled_at TIMESTAMP,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    payment_method_id TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL,
    payment_intent_id TEXT NOT NULL,
    subscription_id TEXT,
    description TEXT NOT NULL,
    metadata TEXT,
    stripe_charge_id TEXT,
    refunded_at TIMESTAMP,
    refund_id TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    email TEXT,
    name TEXT,
    phone TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refunds (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'pending',
    reason TEXT,
    description TEXT,
    stripe_refund_id TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_items (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    price_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subscription_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'open',
    hosted_invoice_url TEXT,
    invoice_pdf TEXT,
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    stripe_invoice_id TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_webhooks (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data TEXT NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notification Tables
CREATE TABLE IF NOT EXISTS device_tokens (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_notifications (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    type TEXT NOT NULL DEFAULT 'system',
    priority TEXT NOT NULL DEFAULT 'normal',
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending',
    platform TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_settings (
    id TEXT PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    meal_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    goal_achievements BOOLEAN NOT NULL DEFAULT TRUE,
    health_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    system_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    marketing_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    quiet_hours_start TEXT,
    quiet_hours_end TEXT,
    frequency TEXT NOT NULL DEFAULT 'immediate',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_templates (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    type TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_stats (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    total_sent INTEGER NOT NULL DEFAULT 0,
    total_delivered INTEGER NOT NULL DEFAULT 0,
    total_opened INTEGER NOT NULL DEFAULT 0,
    total_clicked INTEGER NOT NULL DEFAULT 0,
    total_failed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    target_audience JSONB,
    template_id TEXT REFERENCES notification_templates(id),
    scheduled_for TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'draft',
    total_sent INTEGER NOT NULL DEFAULT 0,
    total_delivered INTEGER NOT NULL DEFAULT 0,
    total_opened INTEGER NOT NULL DEFAULT 0,
    total_clicked INTEGER NOT NULL DEFAULT 0,
    total_failed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY,
    notification_id TEXT NOT NULL REFERENCES push_notifications(id),
    user_id INTEGER NOT NULL,
    device_token_id TEXT REFERENCES device_tokens(id),
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    response JSONB,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    categories JSONB,
    channels JSONB,
    frequency JSONB,
    quiet_hours JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Image Storage Tables
CREATE TABLE IF NOT EXISTS image_metadata (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    file_size_compressed INTEGER,
    compression_ratio DECIMAL(5,2),
    storage_type TEXT NOT NULL DEFAULT 'local',
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    download_count INTEGER NOT NULL DEFAULT 0,
    last_accessed TIMESTAMP,
    expires_at TIMESTAMP,
    metadata TEXT,
    tags TEXT,
    category TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_thumbnails (
    id TEXT PRIMARY KEY,
    image_id TEXT NOT NULL REFERENCES image_metadata(id),
    size TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_type TEXT NOT NULL DEFAULT 'local',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_processing_jobs (
    id TEXT PRIMARY KEY,
    image_id TEXT NOT NULL REFERENCES image_metadata(id),
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    output_data TEXT,
    priority INTEGER NOT NULL DEFAULT 5,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_albums (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_image_id TEXT REFERENCES image_metadata(id),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_album_items (
    id TEXT PRIMARY KEY,
    album_id TEXT NOT NULL REFERENCES image_albums(id),
    image_id TEXT NOT NULL REFERENCES image_metadata(id),
    order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_analytics (
    id TEXT PRIMARY KEY,
    image_id TEXT NOT NULL REFERENCES image_metadata(id),
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_storage_quotas (
    id TEXT PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    total_quota INTEGER NOT NULL DEFAULT 5368709120, -- 5GB
    used_quota INTEGER NOT NULL DEFAULT 0,
    image_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_sharing (
    id TEXT PRIMARY KEY,
    image_id TEXT NOT NULL REFERENCES image_metadata(id),
    shared_by INTEGER NOT NULL,
    shared_with INTEGER,
    access_type TEXT NOT NULL DEFAULT 'view',
    expires_at TIMESTAMP,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_moderation (
    id TEXT PRIMARY KEY,
    image_id TEXT NOT NULL REFERENCES image_metadata(id),
    moderated_by INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    reason TEXT,
    confidence_score DECIMAL(5,4),
    moderation_data TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_cache (
    id TEXT PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    image_id TEXT NOT NULL REFERENCES image_metadata(id),
    size TEXT NOT NULL,
    data TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    hit_count INTEGER NOT NULL DEFAULT 0,
    last_accessed TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS payment_intents_user_id_idx ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS payment_intents_status_idx ON payment_intents(status);
CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS payment_methods_is_default_idx ON payment_methods(is_default);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
CREATE INDEX IF NOT EXISTS transactions_payment_intent_id_idx ON transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id);
CREATE INDEX IF NOT EXISTS customers_stripe_customer_id_idx ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS refunds_transaction_id_idx ON refunds(transaction_id);
CREATE INDEX IF NOT EXISTS subscription_items_subscription_id_idx ON subscription_items(subscription_id);
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_subscription_id_idx ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS payment_webhooks_event_type_idx ON payment_webhooks(event_type);
CREATE INDEX IF NOT EXISTS payment_webhooks_processed_idx ON payment_webhooks(processed);

CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS device_tokens_token_idx ON device_tokens(token);
CREATE INDEX IF NOT EXISTS device_tokens_platform_idx ON device_tokens(platform);
CREATE INDEX IF NOT EXISTS device_tokens_is_active_idx ON device_tokens(is_active);
CREATE INDEX IF NOT EXISTS push_notifications_user_id_idx ON push_notifications(user_id);
CREATE INDEX IF NOT EXISTS push_notifications_status_idx ON push_notifications(status);
CREATE INDEX IF NOT EXISTS push_notifications_type_idx ON push_notifications(type);
CREATE INDEX IF NOT EXISTS push_notifications_scheduled_for_idx ON push_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS push_notifications_platform_idx ON push_notifications(platform);
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS notification_templates_type_idx ON notification_templates(type);
CREATE INDEX IF NOT EXISTS notification_templates_is_active_idx ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS notification_stats_user_id_idx ON notification_stats(user_id);
CREATE INDEX IF NOT EXISTS notification_stats_date_idx ON notification_stats(date);
CREATE INDEX IF NOT EXISTS notification_campaigns_type_idx ON notification_campaigns(type);
CREATE INDEX IF NOT EXISTS notification_campaigns_status_idx ON notification_campaigns(status);
CREATE INDEX IF NOT EXISTS notification_logs_notification_id_idx ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS notification_logs_user_id_idx ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS notification_logs_device_token_id_idx ON notification_logs(device_token_id);
CREATE INDEX IF NOT EXISTS notification_logs_status_idx ON notification_logs(status);
CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx ON notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS image_metadata_user_id_idx ON image_metadata(user_id);
CREATE INDEX IF NOT EXISTS image_metadata_mime_type_idx ON image_metadata(mime_type);
CREATE INDEX IF NOT EXISTS image_metadata_storage_type_idx ON image_metadata(storage_type);
CREATE INDEX IF NOT EXISTS image_metadata_category_idx ON image_metadata(category);
CREATE INDEX IF NOT EXISTS image_metadata_is_deleted_idx ON image_metadata(is_deleted);
CREATE INDEX IF NOT EXISTS image_metadata_expires_at_idx ON image_metadata(expires_at);
CREATE INDEX IF NOT EXISTS image_thumbnails_image_id_idx ON image_thumbnails(image_id);
CREATE INDEX IF NOT EXISTS image_thumbnails_size_idx ON image_thumbnails(size);
CREATE INDEX IF NOT EXISTS image_processing_jobs_image_id_idx ON image_processing_jobs(image_id);
CREATE INDEX IF NOT EXISTS image_processing_jobs_status_idx ON image_processing_jobs(status);
CREATE INDEX IF NOT EXISTS image_processing_jobs_priority_idx ON image_processing_jobs(priority);
CREATE INDEX IF NOT EXISTS image_albums_user_id_idx ON image_albums(user_id);
CREATE INDEX IF NOT EXISTS image_albums_is_public_idx ON image_albums(is_public);
CREATE INDEX IF NOT EXISTS image_album_items_album_id_idx ON image_album_items(album_id);
CREATE INDEX IF NOT EXISTS image_album_items_image_id_idx ON image_album_items(image_id);
CREATE INDEX IF NOT EXISTS image_analytics_image_id_idx ON imageAnalytics(image_id);
CREATE INDEX IF NOT EXISTS image_analytics_user_id_idx ON imageAnalytics(userId);
CREATE INDEX IF NOT EXISTS image_analytics_action_idx ON imageAnalytics(action);
CREATE INDEX IF NOT EXISTS image_analytics_timestamp_idx ON imageAnalytics(timestamp);
CREATE INDEX IF NOT EXISTS image_storage_quotas_user_id_idx ON image_storage_quotas(user_id);
CREATE INDEX IF NOT EXISTS image_sharing_image_id_idx ON imageSharing(image_id);
CREATE INDEX IF NOT EXISTS image_sharing_shared_with_idx ON imageSharing(shared_with);
CREATE INDEX IF NOT EXISTS image_sharing_access_type_idx ON imageSharing(access_type);
CREATE INDEX IF NOT EXISTS image_moderation_image_id_idx ON image_moderation(image_id);
CREATE INDEX IF NOT EXISTS image_moderation_status_idx ON image_moderation(status);
CREATE INDEX IF NOT EXISTS image_cache_cache_key_idx ON imageCache(cache_key);
CREATE INDEX IF NOT EXISTS image_cache_expires_at_idx ON imageCache(expires_at);
CREATE INDEX IF NOT EXISTS image_cache_hit_count_idx ON imageCache(hit_count);

-- Create foreign key constraints
ALTER TABLE payment_intents ADD CONSTRAINT fk_payment_intents_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE payment_methods ADD CONSTRAINT fk_payment_methods_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE subscriptions ADD CONSTRAINT fk_subscriptions_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE customers ADD CONSTRAINT fk_customers_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE refunds ADD CONSTRAINT fk_refunds_transaction_id FOREIGN KEY (transaction_id) REFERENCES transactions(id);
ALTER TABLE subscription_items ADD CONSTRAINT fk_subscription_items_subscription_id FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_subscription_id FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);
ALTER TABLE payment_webhooks ADD CONSTRAINT fk_payment_webhooks_payment_intent_id FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id);

ALTER TABLE device_tokens ADD CONSTRAINT fk_device_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE push_notifications ADD CONSTRAINT fk_push_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE notification_settings ADD CONSTRAINT fk_notification_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE notification_templates ADD CONSTRAINT fk_notification_templates_template_id FOREIGN KEY (template_id) REFERENCES notification_templates(id);
ALTER TABLE notification_stats ADD CONSTRAINT fk_notification_stats_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE notification_campaigns ADD CONSTRAINT fk_notification_campaigns_template_id FOREIGN KEY (template_id) REFERENCES notification_templates(id);
ALTER TABLE notification_logs ADD CONSTRAINT fk_notification_logs_notification_id FOREIGN KEY (notification_id) REFERENCES push_notifications(id);
ALTER TABLE notification_logs ADD CONSTRAINT fk_notification_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE notification_logs ADD CONSTRAINT fk_notification_logs_device_token_id FOREIGN KEY (device_token_id) REFERENCES device_tokens(id);
ALTER TABLE notification_preferences ADD CONSTRAINT fk_notification_preferences_user_id FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE image_metadata ADD CONSTRAINT fk_image_metadata_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE image_thumbnails ADD CONSTRAINT fk_image_thumbnails_image_id FOREIGN KEY (image_id) REFERENCES image_metadata(id);
ALTER TABLE image_processing_jobs ADD CONSTRAINT fk_image_processing_jobs_image_id FOREIGN KEY (image_id) REFERENCES image_metadata(id);
ALTER TABLE image_albums ADD CONSTRAINT fk_image_albums_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE image_albums ADD CONSTRAINT fk_image_albums_cover_image_id FOREIGN KEY (cover_image_id) REFERENCES image_metadata(id);
ALTER TABLE image_album_items ADD CONSTRAINT fk_image_album_items_album_id FOREIGN KEY (album_id) REFERENCES image_albums(id);
ALTER TABLE image_album_items ADD CONSTRAINT fk_image_album_items_image_id FOREIGN KEY (image_id) REFERENCES image_metadata(id);
ALTER TABLE image_analytics ADD CONSTRAINT fk_image_analytics_image_id FOREIGN KEY (image_id) REFERENCES image_metadata(id);
ALTER TABLE image_analytics ADD CONSTRAINT fk_image_analytics_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE image_storage_quotas ADD CONSTRAINT fk_image_storage_quotas_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE image_sharing ADD CONSTRAINT fk_image_sharing_image_id FOREIGN KEY (image_id) REFERENCES image_metadata(id);
ALTER TABLE image_sharing ADD CONSTRAINT fk_image_sharing_shared_by FOREIGN KEY (shared_by) REFERENCES users(id);
ALTER TABLE image_sharing ADD CONSTRAINT fk_image_sharing_shared_with FOREIGN KEY (shared_with) REFERENCES users(id);
ALTER TABLE image_moderation ADD CONSTRAINT fk_image_moderation_image_id FOREIGN KEY (image_id) REFERENCES image_metadata(id);
ALTER TABLE image_cache ADD CONSTRAINT fk_image_cache_image_id FOREIGN KEY (image_id) REFERENCES image_metadata(id);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_items_updated_at BEFORE UPDATE ON subscription_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON device_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_notifications_updated_at BEFORE UPDATE ON push_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_stats_updated_at BEFORE UPDATE ON notification_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_campaigns_updated_at BEFORE UPDATE ON notification_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_logs_updated_at BEFORE UPDATE ON notification_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_metadata_updated_at BEFORE UPDATE ON image_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_thumbnails_updated_at BEFORE UPDATE ON image_thumbnails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_processing_jobs_updated_at BEFORE UPDATE ON image_processing_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_albums_updated_at BEFORE UPDATE ON image_albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_album_items_updated_at BEFORE UPDATE ON image_album_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_analytics_updated_at BEFORE UPDATE ON image_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_storage_quotas_updated_at BEFORE UPDATE ON image_storage_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_sharing_updated_at BEFORE UPDATE ON image_sharing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_moderation_updated_at BEFORE UPDATE ON image_moderation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_cache_updated_at BEFORE UPDATE ON image_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to cleanup expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Delete expired image cache
    DELETE FROM image_cache WHERE expires_at < NOW();
    
    -- Delete expired push notifications
    DELETE FROM push_notifications WHERE expires_at < NOW();
    
    -- Delete expired image metadata
    DELETE FROM image_metadata WHERE expires_at < NOW();
    
    -- Delete expired device tokens (inactive for 6 months)
    DELETE FROM device_tokens WHERE last_used < NOW() - INTERVAL '6 months';
    
    -- Delete expired notification logs (older than 1 year)
    DELETE FROM notification_logs WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Delete expired image analytics (older than 1 year)
    DELETE FROM image_analytics WHERE timestamp < NOW() - INTERVAL '1 year';
    
    -- Delete expired image sharing (older than 1 year)
    DELETE FROM image_sharing WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Delete expired image processing jobs (older than 1 month)
    DELETE FROM image_processing_jobs WHERE created_at < NOW() - INTERVAL '1 month';
    
    -- Delete expired payment webhooks (older than 3 months)
    DELETE FROM payment_webhooks WHERE created_at < NOW() - INTERVAL '3 months';
END;
$$ language 'plpgsql';

-- Create function to update image storage quotas
CREATE OR REPLACE FUNCTION update_image_storage_quota()
RETURNS void AS $$
BEGIN
    UPDATE image_storage_quotas 
    SET 
        used_quota = (
            SELECT COALESCE(SUM(file_size), 0) 
            FROM image_metadata 
            WHERE user_id = image_storage_quotas.user_id 
            AND is_deleted = false
        ),
        image_count = (
            SELECT COUNT(*) 
            FROM image_metadata 
            WHERE user_id = image_storage_quotas.user_id 
            AND is_deleted = false
        ),
        last_updated = NOW()
    WHERE user_id IN (
        SELECT user_id 
        FROM image_metadata 
        WHERE is_deleted = false
        GROUP BY user_id
    );
END;
$$ language 'plpgsql';

-- Create function to update notification statistics
CREATE OR REPLACE FUNCTION update_notification_stats()
RETURNS void AS $$
BEGIN
    INSERT INTO notification_stats (user_id, date, total_sent, total_delivered, total_opened, total_clicked, total_failed)
    SELECT 
        user_id,
        DATE(created_at) as date,
        COUNT(*) as total_sent,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as total_sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as total_delivered,
        SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as total_opened,
        SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as total_clicked,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as total_failed
    FROM push_notifications
    WHERE created_at >= NOW() - INTERVAL '1 day'
    GROUP BY user_id, DATE(created_at)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        total_sent = EXCLUDED.total_sent,
        total_delivered = EXCLUDED.total_delivered,
        total_opened = EXCLUDED.total_opened,
        total_clicked = EXCLUDED.total_clicked,
        total_failed = EXCLUDED.total_failed,
        updated_at = NOW();
END;
$$ language 'plpgsql';

-- Create function to update image download count
CREATE OR REPLACE FUNCTION update_image_download_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.action = 'download' THEN
        UPDATE image_metadata 
        SET download_count = download_count + 1, 
            last_accessed = NOW()
        WHERE id = NEW.image_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_image_download_count_trigger
AFTER INSERT ON image_analytics
FOR EACH ROW EXECUTE FUNCTION update_image_download_count();

-- Grant permissions (adjust based on your user setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_database_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_database_user;

-- Create views for easier reporting
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    user_id,
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount,
    COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_transactions,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
    MAX(created_at) as last_transaction
FROM transactions
GROUP BY user_id;

CREATE OR REPLACE VIEW notification_summary AS
SELECT 
    user_id,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_notifications,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_notifications,
    COUNT(CASE WHEN status = 'opened' THEN 1 END) as opened_notifications,
    COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked_notifications,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_notifications,
    MAX(created_at) as last_notification
FROM push_notifications
GROUP BY user_id;

CREATE OR REPLACE VIEW image_storage_summary AS
SELECT 
    user_id,
    COUNT(*) as total_images,
    SUM(file_size) as total_storage_used,
    SUM(CASE WHEN is_public = true THEN 1 ELSE 0 END) as public_images,
    SUM(CASE WHEN is_public = false THEN 1 ELSE 0 END) as private_images,
    MAX(created_at) as last_upload
FROM image_metadata
WHERE is_deleted = false
GROUP BY user_id;

-- Create materialized views for performance
CREATE MATERIALIZED VIEW payment_stats_mv AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount,
    COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_transactions,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions
FROM transactions
GROUP BY DATE(created_at)
WITH DATA;

CREATE MATERIALIZED VIEW notification_stats_mv AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_notifications,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_notifications,
    COUNT(CASE WHEN status = 'opened' THEN 1 END) as opened_notifications,
    COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked_notifications,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_notifications
FROM push_notifications
GROUP BY DATE(created_at)
WITH DATA;

CREATE MATERIALIZED VIEW image_stats_mv AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_uploads,
    SUM(file_size) as total_storage_used,
    COUNT(CASE WHEN is_public = true THEN 1 ELSE 0 END) as public_uploads,
    COUNT(CASE WHEN is_public = false THEN 1 ELSE 0 END) as private_uploads
FROM image_metadata
WHERE is_deleted = false
GROUP BY DATE(created_at)
WITH DATA;

-- Refresh materialized views function
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW payment_stats_mv;
    REFRESH MATERIALIZED VIEW notification_stats_mv;
    REFRESH MATERIALIZED VIEW image_stats_mv;
END;
$$ language 'plpgsql';

-- Create scheduled job for cleanup (requires pg_cron extension)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('0 2 * * *', $$SELECT cleanup_expired_data();$$); -- Run daily at 2 AM
-- SELECT cron.schedule('0 3 * * *', $$SELECT update_image_storage_quota();$$); -- Run daily at 3 AM
-- SELECT cron.schedule('0 4 * * *', $$SELECT update_notification_stats();$$); -- Run daily at 4 AM
-- SELECT cron.schedule('0 5 * * *', $$SELECT refresh_materialized_views();$$); -- Run daily at 5 AM

-- Create function to get user storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_id_param INTEGER)
RETURNS TABLE (
    total_quota BIGINT,
    used_quota BIGINT,
    available_quota BIGINT,
    image_count INTEGER,
    public_image_count INTEGER,
    private_image_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.total_quota,
        q.used_quota,
        q.total_quota - q.used_quota as available_quota,
        i.image_count,
        i.public_image_count,
        i.private_image_count
    FROM image_storage_quotas q
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) as image_count,
            SUM(CASE WHEN is_public = true THEN 1 ELSE 0 END) as public_image_count,
            SUM(CASE WHEN is_public = false THEN 1 ELSE 0 END) as private_image_count
        FROM image_metadata
        WHERE user_id = user_id_param
        AND is_deleted = false
        GROUP BY user_id
    ) i ON q.user_id = i.user_id
    WHERE q.user_id = user_id_param;
END;
$$ language 'plpgsql';

-- Create function to get user notification preferences
CREATE OR REPLACE FUNCTION get_user_notification_preferences(user_id_param INTEGER)
RETURNS TABLE (
    meal_reminders BOOLEAN,
    goal_achievements BOOLEAN,
    health_alerts BOOLEAN,
    system_notifications BOOLEAN,
    marketing_notifications BOOLEAN,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    quiet_hours_start TEXT,
    quiet_hours_end TEXT,
    frequency TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ns.meal_reminders,
        ns.goal_achievements,
        ns.health_alerts,
        ns.system_notifications,
        ns.marketing_notifications,
        ns.email_notifications,
        ns.push_notifications,
        ns.quiet_hours_start,
        ns.quiet_hours_end,
        ns.frequency
    FROM notification_settings ns
    WHERE ns.user_id = user_id_param;
END;
$$ language 'plpgsql';

-- Create function to get user payment methods
CREATE OR REPLACE FUNCTION get_user_payment_methods(user_id_param INTEGER)
RETURNS TABLE (
    id TEXT,
    type TEXT,
    last4 TEXT,
    brand TEXT,
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.type,
        pm.last4,
        pm.brand,
        pm.exp_month,
        pm.exp_year,
        pm.is_default,
        pm.created_at
    FROM payment_methods pm
    WHERE pm.user_id = user_id_param
    ORDER BY pm.is_default DESC, pm.created_at DESC;
END;
$$ language 'plpgsql';

-- Create function to get user subscriptions
CREATE OR REPLACE FUNCTION get_user_subscriptions(user_id_param INTEGER)
RETURNS TABLE (
    id TEXT,
    plan_id TEXT,
    status TEXT,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    trial_end TIMESTAMP,
    cancel_at_period_end BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.plan_id,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.trial_end,
        s.cancel_at_period_end,
        s.created_at,
        s.updated_at
    FROM subscriptions s
    WHERE s.user_id = user_id_param
    ORDER BY s.created_at DESC;
END;
$$ language 'plpgsql';

-- Create function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(user_id_param INTEGER, limit_param INTEGER DEFAULT 50)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    body TEXT,
    type TEXT,
    priority TEXT,
    status TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pn.id,
        pn.title,
        pn.body,
        pn.type,
        pn.priority,
        pn.status,
        pn.created_at,
        pn.updated_at
    FROM push_notifications pn
    WHERE pn.user_id = user_id_param
    ORDER BY pn.created_at DESC
    LIMIT limit_param;
END;
$$ language 'plpgsql';

-- Create function to get user images
CREATE OR REPLACE FUNCTION get_user_images(user_id_param INTEGER, limit_param INTEGER DEFAULT 50)
RETURNS TABLE (
    id TEXT,
    original_filename TEXT,
    stored_filename TEXT,
    file_size INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    category TEXT,
    is_public BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        im.id,
        im.original_filename,
        im.stored_filename,
        im.file_size,
        im.mime_type,
        im.width,
        im.height,
        im.category,
        im.is_public,
        im.created_at,
        im.updated_at
    FROM image_metadata im
    WHERE im.user_id = user_id_param
    AND im.is_deleted = false
    ORDER BY im.created_at DESC
    LIMIT limit_param;
END;
$$ language 'plpgsql';

-- Create function to get user albums
CREATE OR REPLACE FUNCTION get_user_albums(user_id_param INTEGER, limit_param INTEGER DEFAULT 20)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    is_public BOOLEAN,
    image_count INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ia.id,
        ia.name,
        ia.description,
        ia.is_public,
        (
            SELECT COUNT(*) 
            FROM image_album_items iai 
            WHERE iai.album_id = ia.id
        ) as image_count,
        ia.created_at,
        ia.updated_at
    FROM image_albums ia
    WHERE ia.user_id = user_id_param
    AND ia.is_deleted = false
    ORDER BY ia.created_at DESC
    LIMIT limit_param;
END;
$$ language 'plpgsql';

-- Create function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics(user_id_param INTEGER, days_param INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    total_views INTEGER,
    total_downloads INTEGER,
    total_shares INTEGER,
    total_likes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(ia.timestamp) as date,
        SUM(CASE WHEN ia.action = 'view' THEN 1 ELSE 0 END) as total_views,
        SUM(CASE WHEN ia.action = 'download' THEN 1 ELSE 0 END) as total_downloads,
        SUM(CASE WHEN ia.action = 'share' THEN 1 ELSE 0 END) as total_shares,
        SUM(CASE WHEN ia.action = 'like' THEN 1 ELSE 0 END) as total_likes
    FROM image_analytics ia
    WHERE ia.user_id = user_id_param
    AND ia.timestamp >= NOW() - INTERVAL '1 day' * days_param
    GROUP BY DATE(ia.timestamp)
    ORDER BY date DESC;
END;
$$ language 'plpgsql';

-- Create function to get user payment history
CREATE OR REPLACE FUNCTION get_user_payment_history(user_id_param INTEGER, limit_param INTEGER DEFAULT 50)
RETURNS TABLE (
    id TEXT,
    amount DECIMAL(10,2),
    currency TEXT,
    status TEXT,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.amount,
        t.currency,
        t.status,
        t.description,
        t.created_at,
        t.updated_at
    FROM transactions t
    WHERE t.user_id = user_id_param
    ORDER BY t.created_at DESC
    LIMIT limit_param;
END;
$$ language 'plpgsql';

-- Create function to get user notification settings
CREATE OR REPLACE FUNCTION get_user_notification_settings(user_id_param INTEGER)
RETURNS TABLE (
    id TEXT,
    meal_reminders BOOLEAN,
    goal_achievements BOOLEAN,
    health_alerts BOOLEAN,
    system_notifications BOOLEAN,
    marketing_notifications BOOLEAN,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    quiet_hours_start TEXT,
    quiet_hours_end TEXT,
    frequency TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ns.id,
        ns.meal_reminders,
        ns.goal_achievements,
        ns.health_alerts,
        ns.system_notifications,
        ns.marketing_notifications,
        ns.email_notifications,
        ns.push_notifications,
        ns.quiet_hours_start,
        ns.quiet_hours_end,
        ns.frequency,
        ns.created_at,
        ns.updated_at
    FROM notification_settings ns
    WHERE ns.user_id = user_id_param;
END;
$$ language 'plpgsql';

-- Create function to get user device tokens
CREATE OR REPLACE FUNCTION get_user_device_tokens(user_id_param INTEGER)
RETURNS TABLE (
    id TEXT,
    token TEXT,
    platform TEXT,
    is_active BOOLEAN,
    last_used TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dt.id,
        dt.token,
        dt.platform,
        dt.is_active,
        dt.last_used,
        dt.created_at,
        dt.updated_at
    FROM device_tokens dt
    WHERE dt.user_id = user_id_param
    ORDER BY dt.last_used DESC;
END;
$$ language 'plpgsql';

-- Create function to get user image albums
CREATE OR REPLACE FUNCTION get_user_image_albums(user_id_param INTEGER)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    is_public BOOLEAN,
    image_count INTEGER,
    cover_image_id TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ia.id,
        ia.name,
        ia.description,
        ia.is_public,
        (
            SELECT COUNT(*) 
            FROM image_album_items iai 
            WHERE iai.album_id = ia.id
        ) as image_count,
        ia.cover_image_id,
        ia.created_at,
        ia.updated_at
    FROM image_albums ia
    WHERE ia.user_id = user_id_param
    AND ia.is_deleted = false
    ORDER BY ia.created_at DESC;
END;
$$ language 'plpgsql';

-- Create function to get user image album items
CREATE OR REPLACE FUNCTION get_user_image_album_items(album_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    image_id TEXT,
    order INTEGER,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        iai.id,
        iai.image_id,
        iai.order,
        iai.created_at
    FROM image_album_items iai
    WHERE iai.album_id = album_id_param
    ORDER BY iai.order, iai.created_at;
END;
$$ language 'plpgsql';

-- Create function to get user image metadata
CREATE OR REPLACE FUNCTION get_user_image_metadata(image_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    user_id INTEGER,
    original_filename TEXT,
    stored_filename TEXT,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    file_size_compressed INTEGER,
    compression_ratio DECIMAL(5,2),
    storage_type TEXT,
    is_public BOOLEAN,
    download_count INTEGER,
    last_accessed TIMESTAMP,
    expires_at TIMESTAMP,
    metadata TEXT,
    tags TEXT,
    category TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        im.id,
        im.user_id,
        im.original_filename,
        im.stored_filename,
        im.file_path,
        im.file_size,
        im.mime_type,
        im.width,
        im.height,
        im.file_size_compressed,
        im.compression_ratio,
        im.storage_type,
        im.is_public,
        im.download_count,
        im.last_accessed,
        im.expires_at,
        im.metadata,
        im.tags,
        im.category,
        im.created_at,
        im.updated_at
    FROM image_metadata im
    WHERE im.id = image_id_param;
END;
$$ language 'plpgsql';

-- Create function to get user image thumbnails
CREATE OR REPLACE FUNCTION get_user_image_thumbnails(image_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    size TEXT,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    file_path TEXT,
    mime_type TEXT,