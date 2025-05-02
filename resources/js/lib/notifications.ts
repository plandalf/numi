import { toast } from 'sonner';
import { router } from '@inertiajs/react';

interface FlashMessage {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
}

/**
 * Show a toast notification
 */
export const showToast = (message: React.ReactNode, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    switch (type) {
        case 'success':
            toast.success(message);
            break;
        case 'error':
            toast.error(message);
            break;
        case 'warning':
            toast.warning(message);
            break;
        case 'info':
        default:
            toast.info(message);
            break;
    }
};

/**
 * Handle Inertia flash messages
 */
export const handleFlashMessages = (flash: Record<string, any>) => {
    // Laravel success message
    if (flash.success) {
        showToast(flash.success, 'success');
    }

    // Laravel error message
    if (flash.error) {
        showToast(flash.error, 'error');
    }

    // Laravel status message (used by some Laravel features)
    if (flash.status) {
        showToast(flash.status, 'info');
    }

    // Laravel warning message
    if (flash.warning) {
        showToast(flash.warning, 'warning');
    }
};

// Initialize listeners for Inertia flash messages
export const initFlashMessages = () => {
    // Listen for successful responses
    router.on('success', (event) => {
        if (event.detail.page.props.flash) {
            handleFlashMessages(event.detail.page.props.flash);
        }
    });

    // Listen for navigation responses
    router.on('navigate', (event) => {
        if (event.detail.page.props.flash) {
            handleFlashMessages(event.detail.page.props.flash);
        }
    });
}; 