/**
 * Signup Module Entry Point
 * Initializes the signup page
 */

import { bindEvents } from './events.js';

/**
 * Initialize signup page
 */
function init(): void {
    console.log('📝 Initializing signup module...');

    // Bind all event listeners
    bindEvents();

    console.log('✅ Signup module initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
