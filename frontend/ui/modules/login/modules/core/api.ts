/**
 * Login API Module
 * Handles all authentication API calls
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export interface LoginRequest {
    identifier: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export interface LoginError {
    detail: string;
}

/**
 * Login with email/username and password
 */
export async function login(
    identifier: string,
    password: string
): Promise<{ success: true; data: LoginResponse } | { success: false; error: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login/json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier,
                password,
            }),
        });

        if (!response.ok) {
            const errorData: LoginError = await response.json();
            return {
                success: false,
                error: errorData.detail || '登录失败，请稍后重试',
            };
        }

        const data: LoginResponse = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Login API error:', error);
        return {
            success: false,
            error: '网络错误，请检查您的连接',
        };
    }
}

/**
 * Get current user info with token
 */
export async function getCurrentUser(token: string): Promise<{
    id: string;
    username: string | null;
    identifier: string;
    role: string;
} | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}
