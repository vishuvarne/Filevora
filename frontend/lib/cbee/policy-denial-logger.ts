/**
 * Policy Denial Logger
 * 
 * Centralized logging for policy denials and capability errors
 */

export interface PolicyDenialLog {
    timestamp: number;
    tool_id: string;
    user_id?: string;
    denial_reason: string;
    requested_capabilities?: string[];
    violation_type: 'size_exceeded' | 'unknown_tool' | 'constraint_violation' | 'missing_capability' | 'expired';
    severity: 'warning' | 'error' | 'critical';
}

class PolicyDenialLogger {
    private logs: PolicyDenialLog[] = [];
    private maxLogs: number = 1000;

    /**
     * Log a policy denial
     */
    log(denial: Omit<PolicyDenialLog, 'timestamp'>): void {
        const entry: PolicyDenialLog = {
            ...denial,
            timestamp: Date.now(),
        };

        this.logs.push(entry);

        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Log to console for debugging
        const emoji = this.getSeverityEmoji(entry.severity);
        console.warn(
            `[CBEE Policy Denial] ${emoji} ${entry.violation_type} - ${entry.tool_id}:`,
            entry.denial_reason
        );

        // In production, could send to analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'policy_denial', {
                tool_id: entry.tool_id,
                violation_type: entry.violation_type,
                severity: entry.severity,
            });
        }
    }

    /**
     * Get recent denials
     */
    getRecentDenials(count: number = 10): PolicyDenialLog[] {
        return this.logs.slice(-count);
    }

    /**
     * Get denials for a specific tool
     */
    getDenialsForTool(toolId: string): PolicyDenialLog[] {
        return this.logs.filter(log => log.tool_id === toolId);
    }

    /**
     * Clear all logs
     */
    clear(): void {
        this.logs = [];
    }

    /**
     * Get severity emoji
     */
    private getSeverityEmoji(severity: PolicyDenialLog['severity']): string {
        switch (severity) {
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'critical': return '🚨';
            default: return '❓';
        }
    }

    /**
     * Export logs as JSON
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }
}

/**
 * Singleton instance
 */
export const policyDenialLogger = new PolicyDenialLogger();

/**
 * User-friendly error message generator
 */
export function getUserFriendlyDenialMessage(denial: PolicyDenialLog): string {
    const baseMessage = "We couldn't process your file";

    switch (denial.violation_type) {
        case 'size_exceeded':
            return `${baseMessage} because it exceeds the size limit. ${denial.denial_reason}`;

        case 'unknown_tool':
            return `${baseMessage} because the conversion tool isn't recognized. Please try a different tool.`;

        case 'constraint_violation':
            return `${baseMessage} because it doesn't meet the requirements. ${denial.denial_reason}`;

        case 'missing_capability':
            return `${baseMessage} because required permissions couldn't be granted. This might be a configuration issue.`;

        case 'expired':
            return `${baseMessage} because the processing session expired. Please try again.`;

        default:
            return `${baseMessage}. ${denial.denial_reason}`;
    }
}

/**
 * Developer-friendly error message with debug info
 */
export function getDeveloperDenialMessage(denial: PolicyDenialLog): string {
    return `
╔════════════════════════════════════════════════════════════
║ CBEE Policy Denial
╠════════════════════════════════════════════════════════════
║ Tool: ${denial.tool_id}
║ Type: ${denial.violation_type}
║ Severity: ${denial.severity}
║ Reason: ${denial.denial_reason}
${denial.requested_capabilities ? `║ Requested: ${denial.requested_capabilities.join(', ')}` : ''}
║ Time: ${new Date(denial.timestamp).toISOString()}
╚════════════════════════════════════════════════════════════

How to fix:
${getFixSuggestions(denial.violation_type)}
    `.trim();
}

/**
 * Get fix suggestions based on violation type
 */
function getFixSuggestions(violationType: PolicyDenialLog['violation_type']): string {
    switch (violationType) {
        case 'size_exceeded':
            return '- Reduce file size\n- Split into smaller files\n- Use a different tool with higher limits';

        case 'unknown_tool':
            return '- Check capability registry for supported tools\n- Add tool to registry if new\n- Verify tool ID matches registry';

        case 'constraint_violation':
            return '- Check file format compatibility\n- Verify file isn\'t corrupted\n- Review capability constraints';

        case 'missing_capability':
            return '- Ensure capability is registered\n- Check token signature validity\n- Verify bundle hasn\'t expired';

        case 'expired':
            return '- Refresh the page\n- Try the conversion again\n- Check system time settings';

        default:
            return '- Check console logs for details\n- Review CBEE documentation\n- Contact support';
    }
}
