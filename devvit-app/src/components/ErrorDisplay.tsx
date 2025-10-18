/**
 * User-friendly error display component with recovery actions
 */

import { Devvit } from '@devvit/public-api';
import { GameError, ErrorRecoveryAction, ErrorSeverity } from '../types/errors.js';
import { errorHandler } from '../services/errorHandler.js';

interface ErrorDisplayProps {
  error: GameError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

export const ErrorDisplay: Devvit.CustomComponent<ErrorDisplayProps> = (props) => {
  const { error, onRetry, onDismiss, showDetails = false } = props;
  const recoveryActions = errorHandler.getRecoveryActions(error);

  const getSeverityColor = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return '#FFA500'; // Orange
      case ErrorSeverity.MEDIUM:
        return '#FF6B35'; // Red-orange
      case ErrorSeverity.HIGH:
        return '#FF4444'; // Red
      case ErrorSeverity.CRITICAL:
        return '#CC0000'; // Dark red
      default:
        return '#666666'; // Gray
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return '⚠️';
      case ErrorSeverity.MEDIUM:
        return '❗';
      case ErrorSeverity.HIGH:
        return '🚨';
      case ErrorSeverity.CRITICAL:
        return '💥';
      default:
        return '❓';
    }
  };

  return (
    <vstack 
      padding="medium" 
      backgroundColor="#FFF5F5" 
      cornerRadius="medium"
      border="thin"
      borderColor={getSeverityColor(error.severity)}
    >
      {/* Error Header */}
      <hstack alignment="center middle" gap="small">
        <text size="large">{getSeverityIcon(error.severity)}</text>
        <text 
          size="medium" 
          weight="bold" 
          color={getSeverityColor(error.severity)}
        >
          {error.severity.toUpperCase()} ERROR
        </text>
      </hstack>

      {/* User Message */}
      <text 
        size="medium" 
        color="#333333"
        alignment="center"
        wrap
      >
        {error.userMessage}
      </text>

      {/* Technical Details (if enabled) */}
      {showDetails && (
        <vstack gap="small" padding="small" backgroundColor="#F0F0F0" cornerRadius="small">
          <text size="small" weight="bold" color="#666666">
            Technical Details:
          </text>
          <text size="small" color="#666666" wrap>
            Type: {error.type}
          </text>
          <text size="small" color="#666666" wrap>
            Message: {error.message}
          </text>
          {error.correlationId && (
            <text size="small" color="#666666" wrap>
              ID: {error.correlationId}
            </text>
          )}
        </vstack>
      )}

      {/* Recovery Actions */}
      {recoveryActions.length > 0 && (
        <vstack gap="small">
          <text size="medium" weight="bold" color="#333333">
            What would you like to do?
          </text>
          <hstack gap="small" alignment="center">
            {recoveryActions.map((action, index) => (
              <button
                key={index}
                appearance={action.type === 'retry' ? 'primary' : 'secondary'}
                size="small"
                onPress={() => action.action()}
              >
                {action.label}
              </button>
            ))}
          </hstack>
        </vstack>
      )}

      {/* Default Actions */}
      <hstack gap="small" alignment="center">
        {onRetry && error.retryable && (
          <button
            appearance="primary"
            size="small"
            onPress={onRetry}
          >
            Try Again
          </button>
        )}
        {onDismiss && (
          <button
            appearance="secondary"
            size="small"
            onPress={onDismiss}
          >
            Dismiss
          </button>
        )}
      </hstack>

      {/* Help Text */}
      {error.severity === ErrorSeverity.CRITICAL && (
        <text size="small" color="#666666" alignment="center" wrap>
          If this problem persists, please contact support with error ID: {error.correlationId}
        </text>
      )}
    </vstack>
  );
};

/**
 * Compact error banner for less intrusive error display
 */
interface ErrorBannerProps {
  error: GameError;
  onExpand?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: Devvit.CustomComponent<ErrorBannerProps> = (props) => {
  const { error, onExpand, onDismiss } = props;

  return (
    <hstack 
      padding="small" 
      backgroundColor="#FFE6E6" 
      cornerRadius="small"
      border="thin"
      borderColor="#FF6B6B"
      alignment="center middle"
    >
      <text size="small">⚠️</text>
      <text 
        size="small" 
        color="#CC0000" 
        grow
        wrap
      >
        {error.userMessage}
      </text>
      {onExpand && (
        <button
          appearance="plain"
          size="small"
          onPress={onExpand}
        >
          Details
        </button>
      )}
      {onDismiss && (
        <button
          appearance="plain"
          size="small"
          onPress={onDismiss}
        >
          ✕
        </button>
      )}
    </hstack>
  );
};

/**
 * Loading state with error fallback
 */
interface LoadingWithErrorProps {
  isLoading: boolean;
  error?: GameError;
  onRetry?: () => void;
  children: JSX.Element;
}

export const LoadingWithError: Devvit.CustomComponent<LoadingWithErrorProps> = (props) => {
  const { isLoading, error, onRetry, children } = props;

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={onRetry}
        showDetails={false}
      />
    );
  }

  if (isLoading) {
    return (
      <vstack alignment="center middle" padding="large">
        <text size="medium" color="#666666">
          Loading...
        </text>
      </vstack>
    );
  }

  return children;
};