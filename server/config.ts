export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-32-characters-long';
export const HIPAA_COMPLIANCE_ENABLED = process.env.HIPAA_ENABLED === 'true';
export const AUDIT_LOG_DESTINATION = process.env.AUDIT_LOG_DESTINATION || 'console';