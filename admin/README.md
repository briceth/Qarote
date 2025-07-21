# Rabbit Scout Admin

Admin interface for managing Rabbit Scout feedback and system settings.

## Features

- Admin authentication
- Dashboard with system overview
- Feedback management
  - View all feedback from users
  - Respond to feedback
  - Mark feedback as resolved or pending
- User management (coming soon)
- System settings (coming soon)

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root of the admin directory:

```
VITE_API_URL=http://localhost:3000/api
```

### Building for Production

```bash
npm run build
```

### Deployment

The admin application is deployed separately from the main application and is accessible only to administrators.

## Folder Structure

```
admin/
├── public/         # Static assets
├── src/
│   ├── components/ # Reusable UI components
│   ├── contexts/   # React contexts
│   ├── pages/      # Application pages
│   ├── services/   # API services
│   ├── App.tsx     # Main application component
│   └── main.tsx    # Application entry point
├── .env            # Environment variables
└── package.json    # Project dependencies and scripts
```
