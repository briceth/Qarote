# Privacy Module - Modular Structure

This module has been refactored to follow the **200-line per file rule** while maintaining full backward compatibility.

## 📁 File Structure

```
back-end/src/core/privacy/
├── index.ts              # Main exports and barrel file
├── types.ts              # Type definitions and enums (40 lines)
├── privacy-manager.ts    # Privacy settings and consent (190 lines)
├── encryption.ts         # Data encryption utilities (55 lines)
├── temporary-storage.ts  # TTL-based temporary storage (195 lines)
└── README.md            # This file
```

## 🔄 Backward Compatibility

The main `privacy.ts` file now simply re-exports everything from the modular structure:

```typescript
// This still works exactly as before:
import { PrivacyManager, DataType, StorageMode } from "./privacy";
```

## 📋 Module Responsibilities

### `types.ts`

- Enums: `DataType`, `StorageMode`
- Interfaces: `PrivacySettings`, `EncryptedData`, `CacheStats`, `CleanupResult`

### `privacy-manager.ts`

- Privacy settings management
- User consent handling
- Data storage permissions
- GDPR compliance (data export/deletion)

### `encryption.ts`

- AES-256-GCM encryption/decryption
- Secure data handling utilities

### `temporary-storage.ts`

- PostgreSQL-based temporary storage
- TTL (Time-To-Live) management
- Cache statistics and cleanup

## ✅ Benefits

- ✅ **200-line rule compliance** - All files under 200 lines
- ✅ **Single responsibility** - Each file has a clear focus
- ✅ **Better maintainability** - Easier to find and modify code
- ✅ **Improved testability** - Can test individual components
- ✅ **Full backward compatibility** - No breaking changes

## 🚀 Usage

```typescript
// All these imports still work:
import { PrivacyManager, DataType, StorageMode } from "../core/privacy";
import { TemporaryStorage } from "../core/privacy";
import { EncryptionService } from "../core/privacy";

// Or import specific modules:
import { PrivacyManager } from "../core/privacy/privacy-manager";
import { EncryptionService } from "../core/privacy/encryption";
```

## 📊 Line Count Summary

- `types.ts`: ~40 lines
- `encryption.ts`: ~55 lines
- `privacy-manager.ts`: ~190 lines
- `temporary-storage.ts`: ~195 lines
- `index.ts`: ~20 lines

**Total: ~500 lines** split across focused modules vs. **582 lines** in one file.
