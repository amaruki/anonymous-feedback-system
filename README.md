# Anonymous Feedback System

A comprehensive, secure, and feature-rich anonymous feedback platform built with Next.js 15, Supabase, and Google Gemini AI. This system enables organizations to collect, manage, and analyze anonymous feedback while maintaining complete reporter privacy.

## 🌟 Key Features

### For Reporters
- **Complete Anonymity**: SHA-256 hashed access codes protect identity
- **Easy Submission**: Multi-step guided form with categories and tags
- **Real-time Tracking**: Track feedback status using unique access codes
- **Two-way Communication**: Respond to admin questions anonymously
- **Optional Notifications**: Choose to receive updates via email or Telegram

### For Administrators
- **Powerful Dashboard**: Real-time analytics with charts and trends
- **Smart Management**: Filter, search, and bulk-process feedback
- **AI-Powered Insights**: Automatic categorization, sentiment analysis, and trend detection
- **Moderation Tools**: Spam detection with auto-filtering and manual review queue
- **Custom Configuration**: Tailor categories, questions, and branding to your needs

### AI Capabilities (Google Gemini)
- Automatic category suggestions
- Urgency level assessment
- Sentiment analysis (positive/negative/neutral/mixed)
- Key topics extraction
- Actionable insights generation
- Comprehensive trend reports

## 🚀 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15, React, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts |
| **Backend** | Next.js Server Actions, Supabase (PostgreSQL), Row Level Security |
| **AI & Integrations** | Google Gemini 1.5 Flash, Telegram Bot API, Webhooks |

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account
- Google Gemini API key
- (Optional) Telegram Bot token for notifications

## ⚙️ Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd anonymous-feedback-system
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development Auth Redirect (for local testing)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Optional: API Authentication for external access
FEEDBACK_API_KEY=your_custom_api_key
```

### 3. Database Setup

Run the SQL migration scripts in your Supabase SQL Editor in this order:

1. `scripts/001_create_schema.sql` - Creates tables and RLS policies
2. `scripts/002_seed_data.sql` - Seeds initial categories, tags, and settings
3. `scripts/003_add_ai_fields.sql` - Adds AI analysis fields
4. `scripts/004_reporter_notifications.sql` - Adds notification preferences

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

## 📁 Project Structure

```
anonymous-feedback-system/
├── app/
│   ├── page.tsx                      # Public feedback submission
│   ├── track/page.tsx                # Feedback tracking portal
│   ├── admin/
│   │   ├── page.tsx                  # Admin dashboard
│   │   ├── settings/page.tsx         # Configuration panel
│   │   └── moderation/page.tsx       # Moderation queue
│   ├── auth/
│   │   ├── login/page.tsx            # Admin login
│   │   └── sign-up/page.tsx          # Admin registration
│   ├── actions/                      # Server Actions
│   │   ├── feedback.ts
│   │   ├── config.ts
│   │   └── moderation.ts
│   └── api/                          # REST API endpoints
│       ├── feedback/
│       └── webhooks/
├── components/
│   ├── feedback/
│   │   └── feedback-form.tsx         # Multi-step form
│   ├── admin/                        # Admin components
│   │   ├── admin-dashboard.tsx
│   │   ├── admin-settings.tsx
│   │   ├── analytics-overview.tsx
│   │   ├── feedback-list.tsx
│   │   ├── feedback-detail.tsx
│   │   └── moderation-queue.tsx
│   └── layout/
│       └── site-header.tsx
├── lib/
│   ├── db/
│   │   └── index.ts                  # Database utilities
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   └── middleware.ts             # Auth middleware
│   ├── ai-categorization.ts          # Gemini integration
│   ├── feedback-utils.ts             # Spam detection
│   └── notifications.ts              # Notification handlers
└── scripts/
    └── *.sql                         # Database migrations
```

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| **Anonymity** | SHA-256 hashed access codes, no IP logging |
| **Access Control** | Supabase Row Level Security (RLS) policies |
| **Spam Prevention** | AI-powered detection with trust scoring |
| **Rate Limiting** | Prevents submission flooding |
| **Content Moderation** | Automatic filtering of harmful content |
| **Admin Auth** | Supabase Authentication for admin access |

## 👥 User Workflows

### Reporter Journey
1. Visit feedback page → Complete multi-step form
2. Receive unique access code (format: `XXXX-XXXX-XXXX`)
3. Track feedback status anytime using access code
4. Respond to admin clarification requests (optional)
5. Receive notifications on status changes (optional)

### Admin Journey
1. Login to admin dashboard
2. View analytics: trends, sentiment, categories
3. Review and moderate submissions
4. Request clarifications or update status
5. Configure system: categories, tags, custom questions
6. Setup integrations: email, Telegram, Slack, webhooks
7. Generate AI-powered insight reports

## 🎨 Configuration Options

Administrators can customize:
- **Categories**: Create custom feedback categories with icons and colors
- **Tags**: Define reusable tags for organization
- **Custom Questions**: Add rating scales, multiple choice, or text fields
- **Branding**: Upload logo, set colors, customize site name
- **Notifications**: Configure email, Telegram, Slack, and webhook integrations
- **Moderation Rules**: Set spam detection sensitivity and auto-reject rules

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Live Demo**: [https://anonymous-report-demo.vercel.app/](https://anonymous-report-demo.vercel.app/)

### Deploy to Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- Self-hosted with Docker

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter issues or have questions:
- Open an issue on GitHub
- Check existing documentation
- Review Supabase and Next.js documentation

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Google Gemini AI](https://ai.google.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for transparent, anonymous communication**
