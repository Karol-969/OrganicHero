# Organic Hero - AI-Powered SEO Platform

## Overview

Organic Hero is a React-based web application that showcases an interactive business plan for an AI-powered SEO platform. The application presents a comprehensive view of a multi-agent AI system designed to automate SEO tasks and help businesses achieve top Google rankings. Built as a single-page application (SPA), it features sections covering the business vision, product architecture, core operations, pricing models, and development roadmap.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React stack with TypeScript for type safety. The frontend is built using Vite as the build tool, providing fast development and optimized production builds. The UI is constructed with shadcn/ui components built on top of Radix UI primitives, offering a consistent and accessible design system. Tailwind CSS handles styling with custom CSS variables for theming support.

The application follows a component-based architecture with clear separation of concerns:
- **Pages**: Single home page with a not-found fallback
- **Components**: Modular UI components organized into sections and reusable UI elements
- **Hooks**: Custom React hooks for scroll tracking, mobile detection, and chart integration
- **Routing**: Client-side routing handled by Wouter for lightweight navigation

### Backend Architecture
The backend is built with Express.js and TypeScript, following a modular structure:
- **Server Setup**: Express application with middleware for JSON parsing, logging, and error handling
- **Storage Layer**: Abstract storage interface with in-memory implementation for development
- **Development Integration**: Vite middleware integration for hot module replacement in development

### State Management
The application uses React Query (TanStack Query) for server state management, providing caching, background updates, and error handling. Local component state is managed through React's built-in useState and useContext hooks.

### Data Storage
The project is configured for PostgreSQL using Drizzle ORM for type-safe database operations. The schema defines a basic user table with username/password authentication. The storage layer uses an abstraction pattern allowing for easy switching between in-memory development storage and production database implementations.

### Styling and Design
The design system is built on Tailwind CSS with a custom configuration supporting:
- CSS custom properties for theme variables
- Dark mode support through class-based theming
- Responsive design with mobile-first approach
- Custom color palette with warm neutrals as the base theme

### Build and Development
The build process uses:
- Vite for frontend bundling with React plugin
- esbuild for backend bundling
- TypeScript for type checking across the entire codebase
- PostCSS for CSS processing with Tailwind and Autoprefixer

## External Dependencies

### UI and Styling
- **Radix UI**: Comprehensive collection of accessible, unstyled UI primitives (@radix-ui/react-*)
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Icon library providing consistent iconography
- **class-variance-authority**: Utility for creating type-safe component variants

### State Management and Data Fetching
- **TanStack React Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation (@hookform/resolvers)

### Database and ORM
- **Drizzle ORM**: Type-safe ORM for PostgreSQL with schema generation (drizzle-orm, drizzle-zod)
- **Neon Database**: Serverless PostgreSQL database (@neondatabase/serverless)
- **Drizzle Kit**: CLI tools for database migrations and schema management

### Development and Build Tools
- **Vite**: Fast build tool and development server with React plugin
- **TypeScript**: Static type checking for JavaScript
- **ESBuild**: Fast JavaScript bundler for production builds

### Third-Party Integrations
- **Chart.js**: Canvas-based charting library for data visualization
- **Replit Plugins**: Development environment enhancements for Replit deployment
- **Express Session**: Session management with PostgreSQL store (connect-pg-simple)

### Routing and Navigation
- **Wouter**: Lightweight client-side routing library for React applications

The application is designed to be deployed on Replit with built-in support for development tools and production optimizations.

## Recent Changes (September 15, 2025)

### Major UI Enhancement: Professional Interactive Business Plan Presentation
- **Enhanced Hero Section**: Added animated gradient backgrounds, interactive CTAs with hover effects, animated statistics counter, and professional trust indicators
- **Interactive Data Visualizations**: Integrated Recharts library with horizontal bar charts for competitor analysis and pie charts for market share distribution
- **Professional Loading Experience**: Multi-step progress tracking with AI analysis status indicators, visual progress steps, and enhanced loading animations
- **Competitive Intelligence Dashboard**: Two-column layout with interactive charts and enhanced competitor cards featuring progress bars and color-coded scoring systems
- **Market Position Analytics**: Pie chart visualizations with key metrics cards, growth opportunity assessments, and dynamic progress indicators
- **Visual Design System**: Consistent gradients, micro-interactions, and professional styling throughout using shadcn/ui components with dark mode support

### Previous Core Features
- AI-powered competitor analysis using OpenAI API to find location-specific, contextually relevant competitors
- SERP presence analysis and comprehensive business intelligence display
- Location extraction optimized for Australian addresses and business contexts
- Full-stack SEO analysis with technical scoring and recommendations
- Responsive design with mobile-first approach and accessibility features