/**
 * Login Module Entry Point
 * Initializes the login page
 */

import { bindEvents } from './events.js';
import { isAuthenticated } from '../core/storage.js';

/**
 * Initialize login page
 */
function init(): void {
    console.log('🔐 Initializing login module...');

    // Check if user is already authenticated
    if (isAuthenticated()) {
        console.log('✅ User already authenticated, redirecting...');
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/workspace';
        window.location.href = redirectUrl;
        return;
    }

    // Bind all event listeners
    bindEvents();

    console.log('✅ Login module initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
