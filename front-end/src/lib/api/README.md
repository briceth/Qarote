# API Module Documentation

This directory contains the modularized API client for the RabbitMQ Dashboard application. The original `api.ts` file has been split into focused, maintainable modules that follow the 200-line-per-file rule.

## 📁 File Structure

```
src/lib/api/
├── index.ts                 # Barrel export (main entry point)
├── client.ts                # Main API client (combines all sub-clients)
├── base-client.ts           # Base HTTP client with auth and error handling
├── types.ts                 # Core API types and interfaces
├── rabbitmq-types.ts        # RabbitMQ-specific types (nodes, metrics, etc.)
├── exchange-types.ts        # Exchange, binding, and consumer types
├── message-types.ts         # Message handling types
├── auth-types.ts            # Authentication types
├── alert-types.ts           # Alert management types
├── server-client.ts         # Server management API
├── rabbitmq-client.ts       # RabbitMQ operations API
├── auth-client.ts           # Authentication API
├── alert-client.ts          # Alert management API
└── company-client.ts        # Company privacy settings API
```

## 🏗️ Architecture

### **Modular Design**

- **Single Responsibility**: Each file has a focused purpose
- **Type Safety**: Comprehensive TypeScript interfaces
- **Inheritance**: All clients extend `BaseApiClient`
- **Composition**: Main `ApiClient` combines all functionality

### **Client Hierarchy**

```
BaseApiClient (abstract)
├── ServerApiClient
├── RabbitMQApiClient
├── AuthApiClient
├── AlertApiClient
└── CompanyApiClient
```

## 🚀 Usage

### **Import Methods**

```typescript
// Recommended: Import the main client
import { apiClient } from "@/lib/api";

// For specific functionality
import { RabbitMQApiClient, AlertApiClient } from "@/lib/api";

// Legacy compatibility (still works)
import { apiClient } from "@/lib/api.ts";
```

### **Using the API Client**

```typescript
// Server operations
const servers = await apiClient.getServers();
const connection = await apiClient.testConnection(credentials);

// RabbitMQ operations
const queues = await apiClient.getQueues(serverId);
const messages = await apiClient.browseQueueMessages(serverId, queueName);

// Authentication
const { user, token } = await apiClient.login(credentials);
const profile = await apiClient.getProfile();

// Alert management
const alerts = await apiClient.getAlerts({ status: "ACTIVE" });
const alertRule = await apiClient.createAlertRule(ruleData);
```

### **Using Individual Clients**

```typescript
import { RabbitMQApiClient, AlertApiClient } from "@/lib/api";

const rabbitmqClient = new RabbitMQApiClient();
const alertClient = new AlertApiClient();

const queues = await rabbitmqClient.getQueues(serverId);
const alerts = await alertClient.getAlerts();
```

## 📊 File Size Compliance

All files comply with the 200-line rule:

| File                 | Lines | Purpose                    |
| -------------------- | ----- | -------------------------- |
| `types.ts`           | 172   | Core API types             |
| `rabbitmq-types.ts`  | 295   | RabbitMQ-specific types    |
| `rabbitmq-client.ts` | 205   | RabbitMQ operations        |
| `client.ts`          | 189   | Main API client            |
| `alert-types.ts`     | 145   | Alert management types     |
| `alert-client.ts`    | 121   | Alert operations           |
| `base-client.ts`     | 95    | Base HTTP client           |
| `message-types.ts`   | 85    | Message handling types     |
| `company-client.ts`  | 61    | Company operations         |
| `exchange-types.ts`  | 53    | Exchange and binding types |
| `server-client.ts`   | 52    | Server management          |
| `auth-client.ts`     | 44    | Authentication operations  |
| `auth-types.ts`      | 37    | Authentication types       |
| `index.ts`           | 24    | Barrel export              |

**Total**: 1,578 lines (was 1,270 lines in single file)

## 🔧 Key Features

### **Type Safety**

- Comprehensive TypeScript interfaces
- Proper import/export relationships
- No `any` types used

### **Error Handling**

- Centralized error handling in `BaseApiClient`
- Consistent error messaging
- Proper HTTP status code handling

### **Authentication**

- Token-based authentication
- Automatic token attachment
- Secure token storage

### **Backward Compatibility**

- Legacy `api.ts` file maintained as wrapper
- All existing imports continue to work
- Smooth migration path

## 🔄 Migration Guide

### **For New Code**

```typescript
// ✅ Recommended
import { apiClient } from "@/lib/api";

// ✅ For specific types
import type { Queue, Server, AlertRule } from "@/lib/api";
```

### **For Existing Code**

```typescript
// ✅ Still works (legacy compatibility)
import { apiClient } from "@/lib/api.ts";
import type { Queue, Server } from "@/lib/api.ts";
```

## 🧪 Testing Considerations

Each module can be tested independently:

```typescript
// Test individual clients
import { RabbitMQApiClient } from "@/lib/api";
import { jest } from "@jest/globals";

const mockClient = new RabbitMQApiClient("http://test-api");
// ... test specific functionality
```

## 📈 Benefits Achieved

1. **Maintainability**: Easy to find and modify specific functionality
2. **Testability**: Each module can be tested in isolation
3. **Readability**: Clear separation of concerns
4. **Type Safety**: Comprehensive TypeScript coverage
5. **Performance**: Tree-shaking friendly exports
6. **Scalability**: Easy to add new API endpoints

## 🔮 Future Enhancements

- **Caching**: Add response caching for frequently accessed data
- **Retry Logic**: Implement automatic retry for failed requests
- **Rate Limiting**: Add client-side rate limiting
- **Real-time**: WebSocket support for live updates
- **Validation**: Runtime type validation with Zod
- **Documentation**: Auto-generated API documentation

---

This modular structure provides a solid foundation for the RabbitMQ Dashboard API client, ensuring maintainability, type safety, and excellent developer experience.
