/**
 * Login Events Module
 * Handles all user interactions and events
 */

import { login } from '../core/api.js';
import { saveToken, saveUserId } from '../core/storage.js';
import { showToast, setLoading, showError, clearErrors } from './render.js';

/**
 * Bind all event listeners
 */
export function bindEvents(): void {
    const form = document.getElementById('login-form') as HTMLFormElement;
    const togglePassword = document.getElementById('toggle-password') as HTMLButtonElement;
    const identifierInput = document.getElementById('identifier') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;

    // Form submission
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    // Password toggle
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }

    // Clear errors on input
    if (identifierInput) {
        identifierInput.addEventListener('input', () => clearErrors());
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => clearErrors());
    }

    // Check if user is coming back from signup
    const urlParams = new URLSearchParams(window.location.search);
    const fromSignup = urlParams.get('from');
    if (fromSignup === 'signup') {
        showToast('注册成功！请登录', 'success');
    }
}

/**
 * Handle form submission
 */
async function handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    clearErrors();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const identifier = formData.get('identifier') as string;
    const password = formData.get('password') as string;
    const remember = formData.get('remember') === 'on';

    // Validation
    if (!identifier || !password) {
        showError('请填写所有必填项');
        return;
    }

    if (identifier.length < 3) {
        showError('用户名或邮箱至少3个字符');
        return;
    }

    if (password.length < 6) {
        showError('密码至少6个字符');
        return;
    }

    // Set loading state
    setLoading(true);

    try {
        // Call login API
        const result = await login(identifier, password);

        if (result.success) {
            // Save token and redirect
            saveToken(result.data.access_token, remember);

            // Try to get user ID from token (JWT decode)
            const tokenPayload = parseJwt(result.data.access_token);
            if (tokenPayload && tokenPayload.sub) {
                saveUserId(tokenPayload.sub);
            }

            showToast('登录成功！正在跳转...', 'success');

            // Redirect to workspace or intended page
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/workspace';
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            // Show error message
            showError(result.error);
            setLoading(false);
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('登录失败，请稍后重试');
        setLoading(false);
    }
}

/**
 * Parse JWT token (simple base64 decode)
 */
function parseJwt(token: string): { sub?: string; exp?: number } | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('JWT parse error:', error);
        return null;
    }
}
