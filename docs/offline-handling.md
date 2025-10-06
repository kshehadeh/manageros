# Offline Handling Implementation

## Overview

This document describes the offline handling implementation for ManagerOS, which provides graceful degradation when the internet connection is lost and automatic recovery when connectivity is restored.

## Features Implemented

### 1. Network Status Detection (`useNetworkStatus` hook)

- **Location**: `src/hooks/use-network-status.ts`
- **Purpose**: Detects online/offline status and connection changes
- **Features**:
  - Real-time network status monitoring
  - Connection type detection (if available)
  - Last online time tracking
  - Reconnection state management
  - Callback support for online/offline events

### 2. Offline Indicator Component

- **Location**: `src/components/offline-indicator.tsx`
- **Purpose**: Visual indicator when the app is offline
- **Features**:
  - Fixed top banner showing offline status
  - Last online time display
  - Manual retry button
  - Auto-hide when connection is restored
  - Responsive design with dark/light theme support
  - High z-index (9999) to appear above all other elements

### 3. Offline-Aware Layout Component

- **Location**: `src/components/offline-aware-layout.tsx`
- **Purpose**: Wrapper component that handles offline indicator positioning
- **Features**:
  - Dynamically measures offline indicator height
  - Adds appropriate top padding to content when offline
  - Smooth transitions when indicator appears/disappears
  - Prevents content from being hidden behind the indicator

### 4. Network-Aware Fetch Utility

- **Location**: `src/lib/network-aware-fetch.ts`
- **Purpose**: Enhanced fetch with retry logic and offline handling
- **Features**:
  - Automatic retry with exponential backoff
  - Configurable retry options
  - Network error detection
  - Timeout support
  - Graceful error handling

### 5. Network-Aware Session Provider

- **Location**: `src/components/network-aware-session-provider.tsx`
- **Purpose**: NextAuth session management with offline awareness
- **Features**:
  - Disables session refetching when offline
  - Resumes normal behavior when online
  - Prevents NextAuth errors during offline periods

### 6. Enhanced Notifications Hook

- **Location**: `src/hooks/use-notifications.ts` (updated)
- **Purpose**: Notifications with offline support
- **Features**:
  - Pauses polling when offline
  - Preserves existing notification data
  - Uses network-aware fetch for API calls
  - Graceful error handling

### 7. Updated Notification Bell Component

- **Location**: `src/components/notifications/notification-bell.tsx` (updated)
- **Purpose**: Visual notification indicator with offline support
- **Features**:
  - Shows offline icon when disconnected
  - Disables interaction when offline
  - Displays offline message in dropdown
  - Preserves existing notifications

### 8. Health Check API

- **Location**: `src/app/api/health/route.ts`
- **Purpose**: Simple health check endpoint for reconnection testing
- **Features**:
  - Lightweight endpoint for connectivity testing
  - Returns server status and uptime
  - Used by retry mechanisms

## How It Works

### Network Status Detection

The `useNetworkStatus` hook listens to browser `online`/`offline` events and provides:

```typescript
const { isOnline, isReconnecting, lastOnlineTime, connectionType } =
  useNetworkStatus({
    onOnline: () => console.log('Back online!'),
    onOffline: () => console.log('Gone offline'),
    onReconnect: () => console.log('Reconnected!'),
  })
```

### Offline Indicator

The offline indicator appears as a fixed banner at the top of the page when offline:

- Shows "You are currently offline" message
- Displays last online time
- Provides retry button for manual reconnection
- Auto-hides after 3 seconds when back online

### Network-Aware Fetch

Replaces standard `fetch` calls with enhanced version:

```typescript
import { networkAwareFetch } from '@/lib/network-aware-fetch'

const response = await networkAwareFetch('/api/data', {
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    retryDelayMultiplier: 2,
  },
  timeout: 30000,
})
```

### Session Management

The network-aware session provider automatically:

- Disables session refetching when offline
- Resumes normal session management when online
- Prevents NextAuth errors during offline periods

## Error Handling

### Network Errors

The system handles various network error scenarios:

1. **Complete Disconnection**: Shows offline indicator, pauses polling
2. **Intermittent Connection**: Retries with exponential backoff
3. **Server Errors**: Distinguishes between retryable and non-retryable errors
4. **Timeout Errors**: Configurable timeout with retry logic

### User Experience

- **Offline State**: Clear visual indicators, preserved data
- **Reconnection**: Automatic recovery, manual retry option
- **Error Messages**: User-friendly error handling
- **Data Preservation**: Existing data remains available offline

## Testing Offline Scenarios

### Manual Testing

1. **Disconnect Network**: Turn off WiFi or unplug ethernet
2. **Observe Behavior**:
   - Offline indicator appears
   - Notifications pause
   - Session errors are prevented
3. **Reconnect Network**: Restore internet connection
4. **Verify Recovery**:
   - Offline indicator disappears
   - Notifications resume
   - Normal functionality restored

### Browser DevTools Testing

1. Open Chrome DevTools
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Observe offline behavior
5. Switch back to "No throttling" to test reconnection

## Configuration

### Retry Options

```typescript
const retryOptions = {
  maxRetries: 3, // Maximum retry attempts
  retryDelay: 1000, // Initial delay (ms)
  retryDelayMultiplier: 2, // Exponential backoff multiplier
  maxRetryDelay: 10000, // Maximum delay between retries
  retryCondition: error => {
    // Custom retry logic
    return !error.message.includes('404')
  },
}
```

### Polling Intervals

```typescript
// Notifications polling
useNotifications({
  pollInterval: 30000, // 30 seconds
  enabled: true,
})
```

## Browser Compatibility

- **Modern Browsers**: Full support for all features
- **Legacy Browsers**: Graceful degradation
- **Mobile Browsers**: Responsive design support
- **PWA Support**: Works with service workers

## Future Enhancements

Potential improvements for the offline handling system:

1. **Service Worker Integration**: Cache API responses for true offline functionality
2. **Queue Management**: Queue actions when offline, sync when online
3. **Offline Data Storage**: Store critical data locally for offline access
4. **Push Notifications**: Notify users when back online
5. **Connection Quality Detection**: Adjust behavior based on connection speed

## Troubleshooting

### Common Issues

1. **Offline Indicator Not Showing**: Check browser online/offline event support
2. **Retry Not Working**: Verify retry configuration and error conditions
3. **Session Errors**: Ensure network-aware session provider is used
4. **Notifications Not Pausing**: Check network status hook integration

### Debug Information

Enable debug logging by adding to browser console:

```javascript
// Monitor network status changes
window.addEventListener('online', () => console.log('Online'))
window.addEventListener('offline', () => console.log('Offline'))
```

## Security Considerations

- **Data Privacy**: No sensitive data stored locally
- **Session Security**: Sessions remain secure during offline periods
- **Error Handling**: No sensitive information leaked in error messages
- **Retry Logic**: Prevents infinite retry loops and resource exhaustion
