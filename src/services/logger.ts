/**
 * Legacy logger wrapper for backward compatibility
 * Delegates to the new monitoring service
 */

import { monitor } from '../core/monitoring';

// Re-export monitor as logger for backward compatibility
export const logger = monitor;