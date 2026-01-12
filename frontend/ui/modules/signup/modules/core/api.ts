/**
 * Signup API Module
 * Handles all registration and verification API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export interface SignupRequest {
    identifier: string;
    identifier_type: string;
    password: string;
    username?: string;
}

export interface SignupResponse {
    id: string;
    username: string | null;
    identifier: string;
    role: string;
    verification_sent: boolean;
}

export interface VerifySignupRequest {
    identifier: string;
    code: string;
}

export interface VerifySignupResponse {
    success: boolean;
    message: string;
}

export interface ApiError {
    detail: string;
}

/**
 * Register a new user
 */
export async function register(
    email: string,
    password: string,
    username?: string
): Promise<{ success: true; data: SignupResponse } | { success: false; error: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier: email,
                identifier_type: 'email',
                password,
                username: username || undefined,
            }),
        });

        if (!response.ok) {
            const errorData: ApiError = await response.json();
            return {
                success: false,
                error: errorData.detail || '注册失败，请稍后重试',
            };
        }

        const data: SignupResponse = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Register API error:', error);
        return {
            success: false,
            error: '网络错误，请检查您的连接',
        };
    }
}

/**
 * Verify signup with verification code
 */
export async function verifySignup(
    identifier: string,
    code: string
): Promise<{ success: true; data: VerifySignupResponse } | { success: false; error: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier,
                code: code.toUpperCase(),
            }),
        });

        if (!response.ok) {
            const errorData: ApiError = await response.json();
            return {
                success: false,
                error: errorData.detail || '验证失败，请检查验证码',
            };
        }

        const data: VerifySignupResponse = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Verify signup API error:', error);
        return {
            success: false,
            error: '网络错误，请检查您的连接',
        };
    }
}

/**
 * Resend verification code
 */
export async function resendVerification(
    identifier: string
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier,
            }),
        });

        if (!response.ok) {
            const errorData: ApiError = await response.json();
            return {
                success: false,
                error: errorData.detail || '重新发送失败',
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Resend verification API error:', error);
        return {
            success: false,
            error: '网络错误，请检查您的连接',
        };
    }
}
