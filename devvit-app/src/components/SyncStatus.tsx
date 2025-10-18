/**
 * Sync status component to show offline/online status and sync progress
 */

import { Devvit } from '@devvit/public-api';
import { useState, useEffect } from '@devvit/public-api';
import { SyncStatus as SyncStatusType, offlineSyncService } from '../services/offlineSync.js';

interface SyncStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const SyncStatus: Devvit.CustomComponent<SyncStatusProps> = (props) => {
  const { showDetails = false, compact = false } = props;
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>({
    isOnline: true,
    isSyncing: false,
    pendingItems: 0,
    lastSyncTime: null,
    syncErrors: []
  });

  useEffect(() => {
    // Get initial status
    setSyncStatus(offlineSyncService.getSyncStatus());

    // Listen for status updates
    const handleStatusUpdate = (status: SyncStatusType) => {
      setSyncStatus(status);
    };

    offlineSyncService.addSyncListener(handleStatusUpdate);

    // Cleanup
    return () => {
      offlineSyncService.removeSyncListener(handleStatusUpdate);
    };
  }, []);

  const getStatusIcon = (): string => {
    if (!syncStatus.isOnline) {
      return '📴'; // Offline
    }
    if (syncStatus.isSyncing) {
      return '🔄'; // Syncing
    }
    if (syncStatus.pendingItems > 0) {
      return '⏳'; // Pending
    }
    return '✅'; // All good
  };

  const getStatusText = (): string => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    }
    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }
    if (syncStatus.pendingItems > 0) {
      return `${syncStatus.pendingItems} pending`;
    }
    return 'Online';
  };

  const getStatusColor = (): string => {
    if (!syncStatus.isOnline) {
      return '#FF6B6B'; // Red for offline
    }
    if (syncStatus.isSyncing) {
      return '#4ECDC4'; // Teal for syncing
    }
    if (syncStatus.pendingItems > 0) {
      return '#FFE66D'; // Yellow for pending
    }
    return '#4CAF50'; // Green for online
  };

  const formatLastSync = (): string => {
    if (!syncStatus.lastSyncTime) {
      return 'Never';
    }

    const now = new Date();
    const lastSync = new Date(syncStatus.lastSyncTime);
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 24 * 60) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffMins / (24 * 60));
      return `${days}d ago`;
    }
  };

  const handleForceSync = async () => {
    if (syncStatus.isOnline && !syncStatus.isSyncing) {
      await offlineSyncService.forceSyncNow();
    }
  };

  if (compact) {
    return (
      <hstack alignment="center middle" gap="small">
        <text size="small">{getStatusIcon()}</text>
        <text 
          size="small" 
          color={getStatusColor()}
          weight="bold"
        >
          {getStatusText()}
        </text>
      </hstack>
    );
  }

  return (
    <vstack 
      padding="small" 
      backgroundColor="#F8F9FA" 
      cornerRadius="small"
      border="thin"
      borderColor={getStatusColor()}
    >
      {/* Main Status */}
      <hstack alignment="center middle" gap="small">
        <text size="medium">{getStatusIcon()}</text>
        <text 
          size="medium" 
          color={getStatusColor()}
          weight="bold"
        >
          {getStatusText()}
        </text>
        
        {/* Sync Button */}
        {syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.pendingItems > 0 && (
          <button
            appearance="secondary"
            size="small"
            onPress={handleForceSync}
          >
            Sync Now
          </button>
        )}
      </hstack>

      {/* Detailed Information */}
      {showDetails && (
        <vstack gap="small">
          {/* Connection Status */}
          <hstack alignment="start middle" gap="small">
            <text size="small" color="#666666" weight="bold">
              Connection:
            </text>
            <text size="small" color="#666666">
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </text>
          </hstack>

          {/* Pending Items */}
          {syncStatus.pendingItems > 0 && (
            <hstack alignment="start middle" gap="small">
              <text size="small" color="#666666" weight="bold">
                Pending:
              </text>
              <text size="small" color="#666666">
                {syncStatus.pendingItems} items waiting to sync
              </text>
            </hstack>
          )}

          {/* Last Sync Time */}
          <hstack alignment="start middle" gap="small">
            <text size="small" color="#666666" weight="bold">
              Last Sync:
            </text>
            <text size="small" color="#666666">
              {formatLastSync()}
            </text>
          </hstack>

          {/* Sync Errors */}
          {syncStatus.syncErrors.length > 0 && (
            <vstack gap="small">
              <text size="small" color="#FF6B6B" weight="bold">
                Sync Errors ({syncStatus.syncErrors.length}):
              </text>
              {syncStatus.syncErrors.slice(0, 3).map((error, index) => (
                <text key={index} size="small" color="#FF6B6B" wrap>
                  • {error.userMessage}
                </text>
              ))}
              {syncStatus.syncErrors.length > 3 && (
                <text size="small" color="#666666">
                  ... and {syncStatus.syncErrors.length - 3} more
                </text>
              )}
            </vstack>
          )}

          {/* Offline Mode Message */}
          {!syncStatus.isOnline && (
            <vstack gap="small" padding="small" backgroundColor="#FFF3CD" cornerRadius="small">
              <text size="small" color="#856404" weight="bold">
                📴 Offline Mode
              </text>
              <text size="small" color="#856404" wrap>
                You're currently offline. Your progress is being saved locally and will sync when connection is restored.
              </text>
            </vstack>
          )}

          {/* Syncing Progress */}
          {syncStatus.isSyncing && (
            <vstack gap="small" padding="small" backgroundColor="#D1ECF1" cornerRadius="small">
              <text size="small" color="#0C5460" weight="bold">
                🔄 Syncing Data
              </text>
              <text size="small" color="#0C5460" wrap>
                Uploading your progress and submissions to the server...
              </text>
            </vstack>
          )}
        </vstack>
      )}
    </vstack>
  );
};

/**
 * Compact sync indicator for headers/toolbars
 */
interface SyncIndicatorProps {
  onClick?: () => void;
}

export const SyncIndicator: Devvit.CustomComponent<SyncIndicatorProps> = (props) => {
  const { onClick } = props;
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>({
    isOnline: true,
    isSyncing: false,
    pendingItems: 0,
    lastSyncTime: null,
    syncErrors: []
  });

  useEffect(() => {
    setSyncStatus(offlineSyncService.getSyncStatus());

    const handleStatusUpdate = (status: SyncStatusType) => {
      setSyncStatus(status);
    };

    offlineSyncService.addSyncListener(handleStatusUpdate);

    return () => {
      offlineSyncService.removeSyncListener(handleStatusUpdate);
    };
  }, []);

  const getIndicatorColor = (): string => {
    if (!syncStatus.isOnline) return '#FF6B6B';
    if (syncStatus.isSyncing) return '#4ECDC4';
    if (syncStatus.pendingItems > 0) return '#FFE66D';
    return '#4CAF50';
  };

  return (
    <button
      appearance="plain"
      size="small"
      onPress={onClick}
    >
      <hstack alignment="center middle" gap="small">
        <vstack 
          width="8px" 
          height="8px" 
          backgroundColor={getIndicatorColor()}
          cornerRadius="full"
        />
        {syncStatus.pendingItems > 0 && (
          <text size="small" color="#666666">
            {syncStatus.pendingItems}
          </text>
        )}
      </hstack>
    </button>
  );
};

/**
 * Offline banner to show when user is offline
 */
export const OfflineBanner: Devvit.CustomComponent = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleStatusUpdate = (status: SyncStatusType) => {
      setIsOffline(!status.isOnline);
    };

    offlineSyncService.addSyncListener(handleStatusUpdate);
    
    // Get initial status
    const initialStatus = offlineSyncService.getSyncStatus();
    setIsOffline(!initialStatus.isOnline);

    return () => {
      offlineSyncService.removeSyncListener(handleStatusUpdate);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <hstack 
      padding="small" 
      backgroundColor="#FFF3CD" 
      borderColor="#FFEAA7"
      border="thin"
      alignment="center middle"
      gap="small"
    >
      <text size="small">📴</text>
      <text size="small" color="#856404" grow wrap>
        You're offline. Changes will sync when connection is restored.
      </text>
    </hstack>
  );
};