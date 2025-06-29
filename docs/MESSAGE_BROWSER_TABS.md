# Message Browser - Two-Tab Implementation

## Overview

The Message Browser has been redesigned to provide two distinct modes for viewing RabbitMQ messages:

1. **Live Messages Tab** - Real-time message streaming (SSE-based)
2. **Message History Tab** - Historical message search with advanced filtering

## Features

### Live Messages Tab (Available for All Plans)

- **Real-time Streaming**: Stream messages in real-time using Server-Sent Events (SSE)
- **Queue Selection**: Choose specific queues for focused monitoring
- **Basic Search**: Filter messages by content
- **Connection Status**: Visual indicators for connection health
- **Performance Controls**: Start/stop streaming with clear controls
- **Queue Statistics**: Live statistics for selected queues

### Message History Tab (Premium Feature)

- **Plan-Based Access**:
  - **FREE**: No access (upgrade prompt shown)
  - **FREELANCE**: 1 day retention (fixed, no configuration)
  - **STARTUP**: 1, 7, or 30 days retention (configurable)
  - **BUSINESS**: 1, 7, 30, 90, 180, or 365 days retention (configurable)

- **Advanced Search Features**:
  - Content search within message payloads
  - Filter by routing key
  - Filter by exchange name
  - Date range filtering (start/end dates)
  - Sorting options (timestamp, queue name, routing key, exchange)
  - Pagination support

- **Statistics Dashboard**:
  - Total messages count
  - Unique queues with captured messages
  - Average payload size
  - Plan storage limits

## Technical Implementation

### Backend API Endpoints

- `GET /api/message-history/search` - Search historical messages with filters
- `GET /api/message-history/stats` - Get message history statistics
- `GET /api/message-history/retention-policy` - Get current retention policy
- `PUT /api/message-history/retention-policy` - Update retention policy (if allowed)

### Frontend Components

- `LiveMessagesTab.tsx` - Live streaming interface
- `MessageHistoryTab.tsx` - Historical search interface
- `useMessageHistory.ts` - Custom hooks for API integration

### Plan Validation

The system enforces plan-based access control:

```typescript
// Plan limits example
const planLimits = {
  canAccessMessageHistory: boolean,
  availableRetentionPeriods: number[], // days
  maxMessageHistoryStorage: number,    // GB
  canConfigureRetention: boolean
};
```

## User Experience

### Tab Navigation

Users can switch between "Live Messages" and "Message History" tabs. The tab labels include badges indicating:

- "All Plans" for Live Messages
- "Available" or "Premium" for Message History based on access

### Access Control UX

- **Free Users**: See upgrade prompt with feature explanations
- **Paying Users**: Full access with plan-appropriate retention options
- **Startup/Business**: Additional retention configuration options

### Search Interface

The historical search provides:

- Multi-field filtering form
- Real-time search with pagination
- Clear filters functionality
- Sort controls with visual indicators
- Results summary and navigation

## Integration Points

### Existing SSE System

The live messages tab maintains full compatibility with the existing SSE streaming system:

- Same `useMessageStream` hook
- Same message format and filtering
- Same connection management

### Plan Validation Service

Integrates with existing plan validation:

- Uses `getPlanLimits()` for access control
- Throws `PlanValidationError` for unauthorized access
- Supports plan upgrade recommendations

## Performance Considerations

### Live Messages

- SSE connections are properly managed (connect/disconnect)
- Connection health monitoring with heartbeats
- Automatic cleanup on component unmount

### Historical Search

- Pagination prevents large data loads
- Configurable page sizes (25, 50, 100, 200)
- Efficient database queries with proper indexing
- Client-side caching with react-query

## Future Enhancements

### Planned Database Implementation

- Partitioned `CapturedMessage` table for performance
- Message capture process to store acknowledged messages
- Automated retention policy enforcement
- Background cleanup jobs

### Additional Features

- Message export functionality
- Advanced analytics and trends
- Message replay capabilities
- Compliance reporting tools

## Migration Notes

The existing message browser functionality is preserved in the Live Messages tab. Users will experience:

- No breaking changes to existing workflows
- Enhanced UX with clearer separation of features
- New premium features available based on plan
- Smooth upgrade path for accessing historical data
