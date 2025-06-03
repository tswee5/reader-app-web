# Reader App

A modern web application for tracking, engaging with, and learning from your reading content.

## Features

- Save articles from around the web for later reading
- Clean, distraction-free reading experience
- Automatic progress tracking
- Organize articles with tags and collections
- Highlight important passages and take notes
- AI-powered summaries and insights
- Offline reading capabilities

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Supabase
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Article Parsing**: Mozilla Readability.js
- **AI Features**: Claude AI

## Development Phases

### Phase 1: Core Infrastructure (Weeks 1-2)
1. **Project Setup**
   - Initialize Next.js project with TypeScript
   - Set up Tailwind CSS and Shadcn UI
   - Configure ESLint and Prettier
   - Create basic layout components

2. **Authentication**
   - Implement Supabase authentication
   - Create signup, login, and password reset flows
   - Set up protected routes
   - Create user profiles

### Phase 2: Content Management (Weeks 3-4)
1. **Article Parser Integration**
   - Implement Mozilla Readability.js for article parsing
   - Create serverless function for article fetching and parsing
   - Implement error handling for invalid URLs
   - Add metadata extraction (title, author, publication date, etc.)

2. **Reading Experience**
   - Design clean reading interface
   - Implement progress tracking
   - Create library view for saved articles
   - Add search and filtering capabilities

### Phase 3: Engagement Features (Weeks 5-6)
1. **Highlighting and Notes**
   - Implement text highlighting functionality
   - Create notes system
   - Design highlight management interface
   - Add export capabilities for highlights and notes

2. **Organization**
   - Implement tagging system
   - Create collections feature
   - Add sorting and filtering options
   - Design dashboard for content overview


### Phase 4: AI Integration (Weeks 7-8)
1. **AI-Powered Features**
   - Integrate Claude AI
   - Implement article summarization
   - Add concept explanation functionality
   - Create related content suggestions

2. **Text to Speech**
   - Implement text to speech functionality
   - Add a button to toggle speech on and off
   - Create a speech settings interface
   - Integrate with Google Cloud Text-to-Speech API

3. **Offline Capabilities**
   - Implement IndexedDB for offline storage
   - Add service worker for offline access
   - Create sync mechanism for offline changes
   - Implement download functionality for offline reading

### Phase 5: UX enhancements
1. 

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/reader-app.git
   cd reader-app
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

4. Run the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### AI Configuration

To enable AI features such as article summarization, you need to configure Claude API:

1. Run the setup tool:
   ```bash
   npm run update-claude-key
   ```

2. Follow the prompts to enter your Claude API key

See the detailed [AI Configuration Guide](docs/ai-configuration.md) for more information about obtaining and setting up your API key, troubleshooting, and supported features.

## Database Schema

The application uses the following main tables:

- **users**: User profiles and preferences
- **articles**: Saved articles with metadata and content
- **highlights**: User highlights within articles
- **notes**: User notes associated with articles or highlights
- **tags**: User-defined tags for organization
- **collections**: User-created collections of articles

## Future Performance Optimizations

### Server-Side Rendering for Article Content
- Implement Next.js Server Components for initial article rendering
- Utilize React Server Components (RSC) to reduce client JavaScript bundle
- Server-side process article content with streaming responses
- Leverage Edge Runtime for global low-latency delivery
- Implement intelligent caching strategies with revalidation patterns
- Achieve significant improvements in LCP (Largest Contentful Paint)
- Enable article content indexing for improved SEO
- Configure multi-stage rendering with suspense boundaries for non-critical content
- Implement dynamic OG images generation with Vercel's Image Generation API
- Use React cache() for data fetching with automatic deduplication

### Web Workers for Heavy Operations
- Offload CPU-intensive tasks (parsing, text analysis) to dedicated Worker threads
- Implement Comlink for easier communication with Web Workers
- Use Transferable Objects to minimize serialization overhead
- Create a WorkerPool pattern for managing multiple concurrent operations
- Implement background sync for offline article processing
- Process reading statistics and analytics without blocking the main thread
- Enable parallel processing for multi-article operations
- Create a modular worker architecture with specialized workers for different tasks
- Implement a task prioritization system for critical vs. non-critical operations
- Add performance monitoring for worker operations with custom metrics

### Progressive Web App (PWA) Capabilities
- Implement Workbox-based service workers with advanced caching strategies
- Create optimized app manifest with appropriate icons and splash screens
- Implement background sync for offline article saving and collection management
- Enable IndexedDB for full offline article storage and management
- Add custom install prompts with targeted user journeys
- Implement push notifications for new content in followed topics
- Use Lighthouse audits to achieve 100% PWA score
- Create a sync queue for changes made offline to be processed when online
- Implement content compression for efficient offline storage
- Add smart content rotation policies based on user reading patterns
- Create offline-first UI patterns that gracefully adapt to connectivity changes

### Content Preloading
- Implement predictive preloading based on user reading patterns
- Use `<link rel="preload">` for critical path resources
- Apply route prefetching for anticipated user navigation paths
- Implement staggered loading priorities for non-critical content
- Create a preloading queue manager to prevent network congestion
- Use heuristic algorithms to determine preload candidates
- Implement bandwidth-aware preloading that adapts to network conditions
- Create intelligent prefetching for related articles in collections
- Implement lazy-loaded component hydration for below-the-fold content
- Develop a machine learning model to predict and preload content based on user behavior
- Use the Intersection Observer API for just-in-time resource loading

### Image Dimensions Extraction
- Extract image metadata during article parsing to determine dimensions
- Implement modern image formats (WebP, AVIF) with appropriate fallbacks
- Use `next/image` with priority flags for above-the-fold images
- Generate LQIP (Low-Quality Image Placeholders) for instant visual feedback
- Set explicit width/height attributes on all images to eliminate CLS
- Implement responsive image srcsets with appropriate breakpoints
- Create an image optimization pipeline for all article images
- Implement blurhash for aesthetically pleasing image placeholders
- Create an automated image dimensions extraction service with serverless functions
- Add image compression with quality adjustments based on network conditions
- Implement client-hints for optimal image delivery

### Advanced Data Fetching Strategies
- Implement Incremental Static Regeneration (ISR) for popular articles
- Use SWR for real-time data updates with optimistic UI
- Create a data prefetching layer for smooth pagination experiences
- Implement partial data fetching with GraphQL to minimize payload size
- Create a caching layer with selective invalidation patterns
- Use time-to-live (TTL) strategies for different data types
- Implement query deduplication to prevent redundant network requests

### Performance Monitoring and Optimization
- Implement Real User Monitoring (RUM) with custom performance metrics
- Create performance budgets with automated CI/CD checks
- Use Web Vitals API to track and report core metrics
- Implement automated performance regression testing
- Create a performance dashboard for monitoring trends
- Use PerformanceObserver to track and optimize long tasks
- Implement code splitting and dynamic imports based on usage patterns

These optimizations focus on measurable improvements to Core Web Vitals and overall user experience, particularly for users on variable network conditions or lower-powered devices. Each optimization is designed to be implemented incrementally, with clear metrics for success.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.



