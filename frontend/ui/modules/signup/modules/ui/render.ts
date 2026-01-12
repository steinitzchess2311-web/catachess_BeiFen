/**
 * Signup Render Module
 * Handles UI updates and rendering
 */

/**
 * Show toast notification
 */
export function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const toast = document.getElementById('toast') as HTMLDivElement;
    const toastMessage = document.getElementById('toast-message') as HTMLSpanElement;

    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

/**
 * Set loading state for signup button
 */
export function setLoading(loading: boolean): void {
    const button = document.getElementById('signup-button') as HTMLButtonElement;
    const buttonText = button?.querySelector('.button-text') as HTMLSpanElement;
    const buttonSpinner = button?.querySelector('.button-spinner') as HTMLSpanElement;

    if (!button || !buttonText || !buttonSpinner) return;

    if (loading) {
        button.disabled = true;
        buttonText.style.display = 'none';
        buttonSpinner.style.display = 'inline-block';
    } else {
        button.disabled = false;
        buttonText.style.display = 'inline';
        buttonSpinner.style.display = 'none';
    }
}

/**
 * Set loading state for verify button
 */
export function setVerifyLoading(loading: boolean): void {
    const button = document.getElementById('verify-button') as HTMLButtonElement;
    const buttonText = button?.querySelector('.button-text') as HTMLSpanElement;
    const buttonSpinner = button?.querySelector('.button-spinner') as HTMLSpanElement;

    if (!button || !buttonText || !buttonSpinner) return;

    if (loading) {
        button.disabled = true;
        buttonText.style.display = 'none';
        buttonSpinner.style.display = 'inline-block';
    } else {
        button.disabled = false;
        buttonText.style.display = 'inline';
        buttonSpinner.style.display = 'none';
    }
}

/**
 * Show error message
 */
export function showError(message: string, field?: string): void {
    if (field) {
        const errorElement = document.getElementById(`${field}-error`) as HTMLSpanElement;
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    } else {
        const formMessage = document.getElementById('form-message') as HTMLDivElement;
        if (formMessage) {
            formMessage.textContent = message;
            formMessage.className = 'form-message error';
            formMessage.style.display = 'block';
        }
    }
}

/**
 * Clear all error messages
 */
export function clearErrors(): void {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach((element) => {
        element.textContent = '';
        element.classList.remove('show');
    });

    const formMessages = document.querySelectorAll('.form-message');
    formMessages.forEach((message) => {
        (message as HTMLDivElement).style.display = 'none';
        message.textContent = '';
    });
}

/**
 * Update password strength indicator
 */
export function updatePasswordStrength(password: string): void {
    const strengthElement = document.getElementById('password-strength') as HTMLDivElement;

    if (!strengthElement) return;

    if (password.length === 0) {
        strengthElement.style.display = 'none';
        return;
    }

    strengthElement.classList.add('show');

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) {
        strengthElement.textContent = '密码强度：弱 🔴';
        strengthElement.className = 'password-strength weak show';
    } else if (strength <= 4) {
        strengthElement.textContent = '密码强度：中 🟡';
        strengthElement.className = 'password-strength medium show';
    } else {
        strengthElement.textContent = '密码强度：强 🟢';
        strengthElement.className = 'password-strength strong show';
    }
}

/**
 * Show specific step
 */
export function showStep(step: number): void {
    const signupForm = document.getElementById('signup-form') as HTMLFormElement;
    const verificationForm = document.getElementById('verification-form') as HTMLDivElement;
    const steps = document.querySelectorAll('.step');

    if (step === 1) {
        if (signupForm) signupForm.style.display = 'block';
        if (verificationForm) verificationForm.style.display = 'none';
        steps.forEach((s, i) => {
            s.classList.toggle('active', i === 0);
        });
    } else if (step === 2) {
        if (signupForm) signupForm.style.display = 'none';
        if (verificationForm) verificationForm.style.display = 'block';
        steps.forEach((s, i) => {
            s.classList.toggle('active', i === 1);
        });

        // Update verification email display
        const emailElement = document.getElementById('verification-email') as HTMLParagraphElement;
        const emailInput = document.getElementById('email') as HTMLInputElement;
        if (emailElement && emailInput) {
            emailElement.textContent = emailInput.value;
        }
    }
}

/**
 * Start resend timer
 */
export function startResendTimer(): void {
    const resendButton = document.getElementById('resend-button') as HTMLButtonElement;
    const resendTimer = document.getElementById('resend-timer') as HTMLSpanElement;

    if (!resendButton || !resendTimer) return;

    let seconds = 60;
    resendButton.disabled = true;
    resendButton.style.display = 'none';
    resendTimer.style.display = 'block';

    const timer = setInterval(() => {
        seconds--;
        resendTimer.textContent = `${seconds}秒后可重新发送`;

        if (seconds <= 0) {
            clearInterval(timer);
            resendButton.disabled = false;
            resendButton.style.display = 'inline-block';
            resendTimer.style.display = 'none';
        }
    }, 1000);
}
