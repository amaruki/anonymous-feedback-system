# Anonymous Feedback System

A comprehensive, secure, and feature-rich anonymous feedback platform built with Next.js 15, Supabase, and Google Gemini AI. This system enables organizations to collect, manage, and analyze anonymous feedback while maintaining reporter privacy and ensuring constructive communication.

## Features

### Core Functionality

#### Anonymous Feedback Submission
- **Complete Anonymity**: SHA-256 hashed access codes ensure reporter identity protection
- **Multi-step Form**: Guided submission process with categories, tags, urgency levels, and custom questions
- **Rating Questions**: Support for slider-based ratings, multiple choice, and open-ended responses
- **Access Code System**: Unique 12-character codes (e.g., `ABCD-EFGH-IJKL`) for tracking without identity exposure

#### Feedback Tracking & Follow-up
- **Anonymous Tracking**: Reporters can track their feedback status using their access code
- **Two-way Communication**: Chat-style interface for admin-reporter conversations
- **Optional Notifications**: Reporters can opt-in to receive updates via email or Telegram
- **Status Timeline**: Visual progress tracking (Received → In Progress → Resolved)

#### Admin Dashboard
- **Analytics Overview**: Real-time charts showing category distribution, sentiment breakdown, and trends
- **Feedback Management**: Filter, search, and manage all feedback entries
- **Clarification Requests**: Request additional information without revealing reporter identity
- **Bulk Actions**: Process multiple feedback items simultaneously

### Configuration & Customization

#### Admin Settings
- **Categories Management**: Create, edit, and organize feedback categories with icons and colors
- **Tags System**: Define reusable tags for better organization
- **Custom Questions**: Add rating scales, multiple choice, or text questions to the feedback form
- **Branding**: Customize logo, colors, site name, and trust badges

#### Notification Integrations
- **Email Notifications**: Receive alerts for new feedback and status changes
- **Telegram Bot**: Real-time notifications via Telegram with custom bot token
- **Slack Integration**: Post feedback to Slack channels
- **Webhooks**: Custom webhook support for external integrations

### AI-Powered Features (Google Gemini)

#### Automatic Categorization
- **Smart Category Suggestions**: AI analyzes feedback content to suggest appropriate categories
- **Urgency Assessment**: Automatic urgency level recommendations based on content analysis
- **Sentiment Analysis**: Detect positive, negative, neutral, or mixed sentiment
- **Key Topics Extraction**: Identify main themes and topics automatically
- **Action Items**: Extract actionable suggestions from feedback text

#### Comprehensive Reports
- **Executive Summaries**: AI-generated overview of feedback trends
- **Theme Analysis**: Identify recurring patterns and their frequency
- **Trend Detection**: Spot emerging issues before they escalate

### Security & Moderation

#### Spam Prevention
- **Pattern Detection**: Identify promotional spam, phishing attempts, and abusive content
- **Trust Scoring**: Calculate content quality scores (0-100) for each submission
- **Rate Limiting**: Prevent submission flooding from single sources
- **Gibberish Detection**: Filter out meaningless or automated submissions

#### Moderation Queue
- **Risk Level Filtering**: Prioritize review by critical, high, medium, or low risk
- **Bulk Moderation**: Approve or reject multiple items at once
- **Auto-Reject**: Automatically handle critical threats and obvious spam
- **Detailed Flags**: View specific reasons why content was flagged

#### Row Level Security (RLS)
- **Database-level Protection**: Supabase RLS policies ensure data isolation
- **Admin-only Access**: Sensitive operations restricted to authenticated admins
- **Public Submission**: Anonymous submissions allowed without authentication

## Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router and Server Actions
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **shadcn/ui**: High-quality UI components
- **Recharts**: Data visualization for analytics

### Backend
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Row Level Security**: Database-level access control
- **Server Actions**: Secure server-side mutations

### AI & Integrations
- **Google Gemini 1.5 Flash**: AI-powered categorization and analysis
- **Telegram Bot API**: Real-time notifications
- **Webhook Support**: External system integration

## Environment Variables

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development redirect URL for Supabase Auth
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=your_dev_redirect_url

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Optional: API Authentication
FEEDBACK_API_KEY=your_api_key_for_external_access
\`\`\`

## Database Setup

Run the SQL migration scripts in order:

\`\`\`bash
# 1. Create base schema with RLS policies
scripts/001_create_schema.sql

# 2. Seed initial categories, tags, and settings
scripts/002_seed_data.sql

# 3. Add AI analysis fields
scripts/003_add_ai_fields.sql

# 4. Add reporter notification fields
scripts/004_reporter_notifications.sql
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx                 # Public feedback submission page
│   ├── track/page.tsx           # Feedback tracking page
│   ├── admin/
│   │   ├── page.tsx             # Admin dashboard
│   │   ├── settings/page.tsx    # Admin configuration
│   │   └── moderation/page.tsx  # Moderation queue
│   ├── auth/
│   │   ├── login/page.tsx       # Admin login
│   │   └── sign-up/page.tsx     # Admin registration
│   ├── actions/
│   │   ├── feedback.ts          # Feedback CRUD operations
│   │   ├── config.ts            # Configuration management
│   │   └── moderation.ts        # Moderation actions
│   └── api/
│       ├── feedback/            # REST API endpoints
│       └── webhooks/            # Webhook handlers
├── components/
│   ├── feedback/
│   │   └── feedback-form.tsx    # Multi-step submission form
│   ├── admin/
│   │   ├── admin-dashboard.tsx  # Main dashboard component
│   │   ├── admin-settings.tsx   # Settings management
│   │   ├── analytics-overview.tsx
│   │   ├── feedback-list.tsx
│   │   ├── feedback-detail.tsx
│   │   └── moderation-queue.tsx
│   └── layout/
│       └── site-header.tsx      # Navigation header
├── lib/
│   ├── db/
│   │   └── index.ts             # Database client and helpers
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   ├── server.ts            # Server Supabase client
│   │   └── middleware.ts        # Auth middleware
│   ├── ai-categorization.ts     # Gemini AI integration
│   ├── feedback-utils.ts        # Spam detection utilities
│   └── notifications.ts         # Notification handlers
└── scripts/
    └── *.sql                    # Database migrations
\`\`\`

## API Endpoints

### Public Endpoints

#### Submit Feedback
\`\`\`http
POST /api/feedback
Content-Type: application/json

{
  "subject": "Feedback subject",
  "description": "Detailed description",
  "category_id": "uuid",
  "feedback_type": "suggestion|concern|praise|question",
  "urgency": "low|medium|high|critical"
}
\`\`\`

#### Track Feedback
\`\`\`http
GET /api/feedback/track?code=XXXX-XXXX-XXXX
\`\`\`

### Admin Endpoints (Requires API Key)

#### List All Feedback
\`\`\`http
GET /api/feedback
X-API-Key: your_api_key
\`\`\`

#### Get Single Feedback
\`\`\`http
GET /api/feedback/[id]
X-API-Key: your_api_key
\`\`\`

#### Update Feedback Status
\`\`\`http
PATCH /api/feedback/[id]
X-API-Key: your_api_key
Content-Type: application/json

{
  "status": "in-progress|resolved",
  "admin_notes": "Notes about resolution"
}
\`\`\`

## User Flows

### Reporter Flow
1. Visit the feedback page
2. Complete multi-step form (category, details, optional contact)
3. Receive unique access code
4. Track feedback status using access code
5. Respond to clarification requests anonymously
6. Receive optional notifications on updates

### Admin Flow
1. Login to admin dashboard
2. View analytics and trends
3. Review feedback in moderation queue
4. Request clarifications or update status
5. Configure categories, tags, and questions
6. Set up notification integrations
7. Generate AI-powered reports

## Security Considerations

- **No IP Logging**: Reporter IPs are never stored
- **Hashed Access Codes**: SHA-256 hashing for access code storage
- **RLS Policies**: Database-level access control
- **Content Moderation**: Automated spam and abuse detection
- **Optional Identification**: Reporters choose whether to receive notifications
- **Admin Authentication**: Supabase Auth for admin access

## Deployment

Your project is live at:

**[https://vercel.com/ngapas-projects/v0-anonymous-feedback-system](https://vercel.com/ngapas-projects/v0-anonymous-feedback-system)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/oolyGydXcOs](https://v0.app/chat/oolyGydXcOs)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## License

MIT License - See LICENSE file for details
