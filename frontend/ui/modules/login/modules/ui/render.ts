/**
 * Login Render Module
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

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

/**
 * Set loading state
 */
export function setLoading(loading: boolean): void {
    const button = document.getElementById('login-button') as HTMLButtonElement;
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
    const formMessage = document.getElementById('form-message') as HTMLDivElement;

    if (field) {
        // Show field-specific error
        const errorElement = document.getElementById(`${field}-error`) as HTMLSpanElement;
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    } else {
        // Show general form error
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
    // Clear field errors
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach((element) => {
        element.textContent = '';
        element.classList.remove('show');
    });

    // Clear form message
    const formMessage = document.getElementById('form-message') as HTMLDivElement;
    if (formMessage) {
        formMessage.style.display = 'none';
        formMessage.textContent = '';
    }
}

/**
 * Show success message
 */
export function showSuccess(message: string): void {
    const formMessage = document.getElementById('form-message') as HTMLDivElement;

    if (formMessage) {
        formMessage.textContent = message;
        formMessage.className = 'form-message success';
        formMessage.style.display = 'block';
    }
}
