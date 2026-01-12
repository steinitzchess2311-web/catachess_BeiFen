/**
 * Storage Module
 * Handles localStorage operations for authentication
 */

const TOKEN_KEY = 'catachess_token';
const USER_ID_KEY = 'catachess_user_id';
const REMEMBER_KEY = 'catachess_remember';

/**
 * Save authentication token
 */
export function saveToken(token: string, remember: boolean = false): void {
    if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REMEMBER_KEY, 'true');
    } else {
        sessionStorage.setItem(TOKEN_KEY, token);
        localStorage.removeItem(REMEMBER_KEY);
    }
}

/**
 * Get authentication token
 */
export function getToken(): string | null {
    // Check if user wanted to be remembered
    const remember = localStorage.getItem(REMEMBER_KEY) === 'true';

    if (remember) {
        return localStorage.getItem(TOKEN_KEY);
    } else {
        return sessionStorage.getItem(TOKEN_KEY);
    }
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(USER_ID_KEY);
}

/**
 * Save user ID
 */
export function saveUserId(userId: string): void {
    const remember = localStorage.getItem(REMEMBER_KEY) === 'true';

    if (remember) {
        localStorage.setItem(USER_ID_KEY, userId);
    } else {
        sessionStorage.setItem(USER_ID_KEY, userId);
    }
}

/**
 * Get user ID
 */
export function getUserId(): string | null {
    const remember = localStorage.getItem(REMEMBER_KEY) === 'true';

    if (remember) {
        return localStorage.getItem(USER_ID_KEY);
    } else {
        return sessionStorage.getItem(USER_ID_KEY);
    }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return getToken() !== null;
}
