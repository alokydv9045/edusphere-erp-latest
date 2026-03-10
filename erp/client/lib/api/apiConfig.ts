/**
 * Centralized API configuration for the EduSphere ERP Client
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Derived server base URL (removing /api suffix)
 * Useful for static file serving (e.g., logos, uploads)
 */
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export const CONFIG_KEYS = {
    SCHOOL_NAME: 'school_name',
    SCHOOL_LOGO: 'school_logo',
    SCHOOL_START_TIME: 'school_start_time',
};
