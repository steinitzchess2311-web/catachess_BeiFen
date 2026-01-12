/**
 * Signup Events Module
 * Handles all user interactions and events
 */

import { register, verifySignup, resendVerification } from '../core/api.js';
import {
    showToast,
    setLoading,
    showError,
    clearErrors,
    updatePasswordStrength,
    showStep,
    startResendTimer,
    setVerifyLoading,
} from './render.js';

let currentEmail = '';
let resendTimerActive = false;

/**
 * Bind all event listeners
 */
export function bindEvents(): void {
    bindSignupFormEvents();
    bindVerificationFormEvents();
}

/**
 * Bind signup form events
 */
function bindSignupFormEvents(): void {
    const form = document.getElementById('signup-form') as HTMLFormElement;
    const togglePassword = document.getElementById('toggle-password') as HTMLButtonElement;
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password') as HTMLButtonElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirm-password') as HTMLInputElement;

    // Form submission
    if (form) {
        form.addEventListener('submit', handleSignupSubmit);
    }

    // Password toggles
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }

    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', () => {
            const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
            confirmPasswordInput.type = type;
            toggleConfirmPassword.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }

    // Password strength indicator
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            updatePasswordStrength(passwordInput.value);
            clearErrors();
        });
    }

    // Clear errors on input
    const inputs = form?.querySelectorAll('input');
    inputs?.forEach((input) => {
        input.addEventListener('input', () => clearErrors());
    });
}

/**
 * Bind verification form events
 */
function bindVerificationFormEvents(): void {
    const verifyButton = document.getElementById('verify-button') as HTMLButtonElement;
    const resendButton = document.getElementById('resend-button') as HTMLButtonElement;
    const codeInput = document.getElementById('verification-code') as HTMLInputElement;

    if (verifyButton) {
        verifyButton.addEventListener('click', handleVerifySubmit);
    }

    if (resendButton) {
        resendButton.addEventListener('click', handleResendCode);
    }

    // Auto-submit when code is complete
    if (codeInput) {
        codeInput.addEventListener('input', (e) => {
            const input = e.target as HTMLInputElement;
            input.value = input.value.toUpperCase();

            if (input.value.length === 6) {
                handleVerifySubmit();
            }
        });
    }
}

/**
 * Handle signup form submission
 */
async function handleSignupSubmit(event: Event): Promise<void> {
    event.preventDefault();
    clearErrors();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const email = formData.get('email') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;
    const agreeTerms = formData.get('agree-terms') === 'on';

    // Validation
    if (!email || !password || !confirmPassword) {
        showError('请填写所有必填项');
        return;
    }

    if (!isValidEmail(email)) {
        showError('请输入有效的邮箱地址', 'email');
        return;
    }

    if (password.length < 6) {
        showError('密码至少需要6个字符', 'password');
        return;
    }

    if (password !== confirmPassword) {
        showError('两次输入的密码不一致', 'confirm-password');
        return;
    }

    if (!agreeTerms) {
        showError('请阅读并同意服务条款和隐私政策', 'terms');
        return;
    }

    // Set loading state
    setLoading(true);

    try {
        // Call register API
        const result = await register(email, password, username || undefined);

        if (result.success) {
            currentEmail = email;

            // Show verification step
            showToast('注册成功！请查收验证邮件', 'success');
            showStep(2);
            startResendTimer();
        } else {
            showError(result.error);
            setLoading(false);
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError('注册失败，请稍后重试');
        setLoading(false);
    }
}

/**
 * Handle verification code submission
 */
async function handleVerifySubmit(): Promise<void> {
    clearErrors();

    const codeInput = document.getElementById('verification-code') as HTMLInputElement;
    const code = codeInput.value.trim();

    if (!code || code.length !== 6) {
        showError('请输入6位验证码', 'verification');
        return;
    }

    setVerifyLoading(true);

    try {
        const result = await verifySignup(currentEmail, code);

        if (result.success) {
            showToast('验证成功！正在跳转到登录页...', 'success');

            setTimeout(() => {
                window.location.href = '/login.html?from=signup';
            }, 1500);
        } else {
            showError(result.error, 'verification');
            setVerifyLoading(false);
        }
    } catch (error) {
        console.error('Verify error:', error);
        showError('验证失败，请稍后重试', 'verification');
        setVerifyLoading(false);
    }
}

/**
 * Handle resend verification code
 */
async function handleResendCode(): Promise<void> {
    if (resendTimerActive) {
        return;
    }

    clearErrors();

    try {
        const result = await resendVerification(currentEmail);

        if (result.success) {
            showToast('验证码已重新发送', 'success');
            startResendTimer();
        } else {
            showError(result.error, 'verification');
        }
    } catch (error) {
        console.error('Resend error:', error);
        showError('重新发送失败，请稍后重试', 'verification');
    }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Start resend timer (60 seconds)
 */
function startResendTimerInternal(): void {
    resendTimerActive = true;
    let seconds = 60;

    const timer = setInterval(() => {
        seconds--;

        if (seconds <= 0) {
            clearInterval(timer);
            resendTimerActive = false;
        }
    }, 1000);
}
