# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for Rabbit Scout.

## Prerequisites

- Google Cloud Console account
- Rabbit Scout application running locally

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Choose "Web application" as the application type
7. Add your authorized origins:
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)
8. Copy the Client ID

## Step 2: Configure Environment Variables

### Front-end (.env.local)

Create a `.env.local` file in the `front-end` directory:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_API_URL=http://localhost:3000
```

### Back-end (.env)

Add to your existing `.env` file in the `back-end` directory:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Note**: The `GOOGLE_CLIENT_ID` is now validated and managed through the centralized config system in `src/config/index.ts`. This ensures proper validation and type safety.

## Step 3: Database Migration

The database schema has been updated to support Google OAuth. Run the migration:

```bash
cd back-end
npx prisma migrate dev
```

## Step 4: Test the Integration

1. Start your back-end server:

   ```bash
   cd back-end
   npm run dev
   ```

2. Start your front-end development server:

   ```bash
   cd front-end
   npm run dev
   ```

3. Navigate to `http://localhost:5173/auth/sign-in`
4. You should see a "Sign in with Google" button
5. Click it to test the Google OAuth flow

## Features

- **New Users**: Automatically creates a new account with Google OAuth
- **Existing Users**: Links Google OAuth to existing email/password accounts
- **Email Verification**: Google accounts are automatically verified
- **Workspace Creation**: New users get a default workspace created
- **Seamless Integration**: Works alongside existing email/password authentication

## Troubleshooting

### Common Issues

1. **"Invalid client ID"**: Make sure your `VITE_GOOGLE_CLIENT_ID` is correct
2. **"Origin not authorized"**: Add your domain to authorized origins in Google Console
3. **"API not enabled"**: Enable the Google+ API or Google Identity API
4. **Database errors**: Make sure you've run the Prisma migration

### Debug Mode

To debug Google OAuth issues, check the browser console and network tab for error messages.

## Security Notes

- Never commit your Google Client ID to version control
- Use different Client IDs for development and production
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console

## Production Deployment

When deploying to production:

1. Create a new OAuth client ID for your production domain
2. Update environment variables with production values
3. Ensure your production domain is added to authorized origins
4. Test the OAuth flow in production environment
