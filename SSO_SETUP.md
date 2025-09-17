# SSO (Single Sign-On) Setup Guide

This guide explains how to set up and configure SSO authentication for enterprise users using Auth0, with a flexible architecture that allows for easy migration to other providers like Firebase Auth in the future.

## Overview

The SSO implementation provides:
- **Enterprise-only SSO**: Only available for workspaces with `ENTERPRISE` plan
- **Flexible provider architecture**: Easy to switch from Auth0 to other providers
- **Secure token validation**: Server-side verification of SSO tokens
- **Workspace association**: Enterprise users can specify their workspace ID
- **Fallback authentication**: Regular users can still use email/password or Google OAuth

## Architecture

### Backend Components

1. **SSO Service** (`src/services/sso.service.ts`)
   - Provider abstraction interface
   - Auth0 implementation
   - Placeholder for Firebase Auth
   - Singleton service factory

2. **Auth0 Controller** (`src/controllers/auth/auth0.controller.ts`)
   - `/api/auth/auth0/sso` - SSO authentication endpoint
   - `/api/auth/auth0/config` - Configuration endpoint
   - Enterprise workspace validation
   - User creation/linking logic

3. **Database Schema Updates**
   - Added `auth0Id`, `ssoProvider`, `ssoMetadata` fields to User model
   - Migration: `20250115120000_add_sso_fields`

### Frontend Components

1. **SSO Service** (`src/services/sso.service.ts`)
   - Client-side provider abstraction
   - Auth0 SPA SDK integration
   - Token management

2. **SSO Components**
   - `Auth0SSOButton` - SSO login button
   - `SSOCallback` - Handles Auth0 redirect
   - `EnterpriseSSOLogin` - Enterprise-specific login page

3. **SSO Hook** (`src/hooks/useSSO.ts`)
   - React hook for SSO state management
   - Authentication status tracking

## Setup Instructions

### 1. Auth0 Configuration

#### Create Auth0 Application
1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new **Single Page Application**
3. Configure the following settings:

**Application Settings:**
- **Allowed Callback URLs**: `http://localhost:3000/auth/sso/callback` (development), `https://yourdomain.com/auth/sso/callback` (production)
- **Allowed Logout URLs**: `http://localhost:3000` (development), `https://yourdomain.com` (production)
- **Allowed Web Origins**: `http://localhost:3000` (development), `https://yourdomain.com` (production)

**Advanced Settings:**
- **Grant Types**: Authorization Code, Refresh Token
- **Response Type**: Code
- **Response Mode**: Query

#### Environment Variables

Add these environment variables to your backend `.env` file:

```env
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

### 2. Database Migration

Run the database migration to add SSO fields:

```bash
cd back-end
npx prisma migrate deploy
```

### 3. Enterprise Workspace Setup

To enable SSO for a workspace:

1. **Upgrade to Enterprise Plan**: Ensure the workspace has `plan: "ENTERPRISE"`
2. **Get Workspace ID**: Find the workspace ID from the database or admin panel
3. **Share with Users**: Provide the workspace ID to enterprise users

### 4. User Flow

#### For Enterprise Users
1. Go to `/auth/enterprise-sso`
2. Enter their workspace ID
3. Click "Sign in with SSO"
4. Redirected to Auth0 for authentication
5. After successful auth, redirected back to the application

#### For Regular Users
1. Go to `/auth/sign-in`
2. Use regular email/password or Google OAuth
3. SSO button is available but not required

## API Endpoints

### POST `/api/auth/auth0/sso`
Authenticates a user with Auth0 SSO.

**Request Body:**
```json
{
  "accessToken": "auth0-access-token",
  "workspaceId": "optional-workspace-id"
}
```

**Response:**
```json
{
  "user": { /* SafeUser object */ },
  "token": "jwt-token",
  "workspace": { /* Workspace object */ },
  "ssoProvider": "auth0"
}
```

### GET `/api/auth/auth0/config`
Returns Auth0 configuration for frontend initialization.

**Response:**
```json
{
  "domain": "your-tenant.auth0.com",
  "clientId": "your-client-id"
}
```

## Security Considerations

1. **Token Validation**: All SSO tokens are validated server-side
2. **Enterprise Restriction**: SSO is only available for enterprise workspaces
3. **Workspace Validation**: Users can only join workspaces they're authorized for
4. **Secure Storage**: SSO metadata is stored securely in the database

## Future Migration to Firebase Auth

The architecture is designed for easy migration:

1. **Create Firebase Provider**: Implement `FirebaseAuthProvider` class
2. **Update Configuration**: Add Firebase config to environment variables
3. **Switch Provider**: Use `ssoService.setProvider(new FirebaseAuthProvider())`
4. **Update Frontend**: Replace Auth0 SPA SDK with Firebase SDK

### Example Firebase Implementation

```typescript
export class FirebaseAuthProvider implements SSOProvider {
  public readonly name = "firebase";
  
  async verifyToken(token: string): Promise<SSOUserInfo> {
    // Implement Firebase token verification
    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      id: decodedToken.uid,
      email: decodedToken.email,
      // ... other fields
    };
  }
  
  // ... other methods
}
```

## Troubleshooting

### Common Issues

1. **"SSO is only available for enterprise workspaces"**
   - Ensure the workspace has `plan: "ENTERPRISE"`
   - Check workspace ID is correct

2. **"Invalid Auth0 token"**
   - Verify Auth0 configuration
   - Check token expiration
   - Ensure proper audience configuration

3. **"Failed to initialize SSO service"**
   - Check environment variables
   - Verify Auth0 application settings
   - Check network connectivity

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

## Testing

### Manual Testing
1. Create an enterprise workspace
2. Set up Auth0 application
3. Test SSO login flow
4. Verify user creation/linking
5. Test workspace association

### Automated Testing
```bash
# Backend tests
cd back-end
npm test

# Frontend tests
cd front-end
npm test
```

## Monitoring

Monitor SSO usage through:
- Auth0 Dashboard analytics
- Application logs
- Database user creation metrics
- Sentry error tracking

## Support

For issues with SSO implementation:
1. Check Auth0 Dashboard for errors
2. Review application logs
3. Verify environment configuration
4. Test with different browsers/devices
