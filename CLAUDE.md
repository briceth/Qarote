# CLAUDE.md - Project Guidelines

## Front-End Commands
- `cd front-end && npm run dev` - Start development server
- `cd front-end && npm run build` - Build for production
- `cd front-end && npm run lint` - Run ESLint checks
- `cd front-end && npm run preview` - Preview production build

## Back-End Commands
- `cd back-end && npm run dev` - Start API development server
- `cd back-end && npm run build` - Build API for production
- `cd back-end && npm run start` - Run production API server
- `cd back-end && npm run prisma:generate` - Generate Prisma client
- `cd back-end && npm run prisma:migrate` - Run database migrations
- `cd back-end && npm run prisma:studio` - Open Prisma Studio UI

## Front-End Code Style
- **Imports**: React first, then external libs, then internal with alias paths (@/)
- **Component Naming**: PascalCase for components (e.g., `QueueCard.tsx`)
- **Types**: Define interfaces for all component props with `Props` suffix
- **UI Components**: Use shadcn/ui components with Tailwind CSS
- **Styling**: Use Tailwind CSS with `cn()` utility for class merging
- **State Management**: Use React Query for API data

## Back-End Code Style
- **API Architecture**: Hono.js RESTful API with PostgreSQL & Prisma ORM
- **Validation**: Use Zod schemas for input validation
- **Error Handling**: Consistent error responses with status codes
- **Controllers**: Group related endpoints in controller modules
- **Middleware**: Use middleware for cross-cutting concerns (CORS, logging)
- **Database**: Use Prisma for type-safe database access

## Folder Structure
### Front-End
- `/src/components/` - React components
- `/src/components/ui/` - UI library components
- `/src/pages/` - Page components
- `/src/hooks/` - Custom React hooks
- `/src/lib/` - Utility functions

### Back-End
- `/src/controllers/` - API route controllers
- `/src/middlewares/` - Express middleware
- `/src/schemas/` - Zod validation schemas
- `/src/utils/` - Utility functions
- `/prisma/` - Database schema and migrations