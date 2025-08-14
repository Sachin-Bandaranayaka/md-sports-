# MS Sports Inventory Management System

A comprehensive inventory management system for MS Sports, a retail business with multiple shop locations in Sri Lanka. This system allows for centralized inventory management, inter-shop transfers, role-based access control, and comprehensive reporting.

## Features

- Multi-shop inventory management with transfer capability
- Role-based access control
- Customer management (credit vs. cash customers)
- Invoice generation and management
- SMS integration for notifications
- Export features for reports (PDF and Excel)
- AI integration using ChatGPT 4o-mini
- AI chatbot for business inquiries and assistance powered by Deepseek

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express.js for API development
- **Database**: NeonDB (PostgreSQL-compatible)
- **Authentication**: JWT-based token system with role-based permissions
- **Deployment**: Cloud-based deployment
- **AI**: Deepseek API for intelligent chatbot capabilities

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Installation

1. Clone the repository:

```bash
git clone https://github.com/md-sports/inventory-management.git
cd inventory-management
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
DATABASE_URL=your_neondb_connection_string
DEEPSEEK_API_KEY=your_deepseek_api_key
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to view the application.

## AI Chatbot

The system includes an AI-powered chatbot to assist users with:

- Answering questions about inventory status
- Providing sales information
- Helping with customer inquiries
- Explaining system features and usage
- Offering business insights

### Setting Up the Chatbot

1. Get an API key from [Deepseek](https://platform.deepseek.com/api_keys)
2. Add the API key to your `.env.local` file:
   ```
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```
3. The chatbot will automatically be available on all pages of the application
4. You can also access the dedicated chatbot page at `/chatbot`

### Customizing the Chatbot

You can customize the chatbot's behavior by modifying:
- The business context in the API route (`src/app/api/chatbot/route.ts`)
- The UI components in the chatbot folder (`src/components/chatbot/`)
- The available business information in the chatbot service (`src/services/chatbotService.ts`)

## Development Conventions

### Code Style

- Use TypeScript for all new files
- Follow ESLint configuration
- Use Tailwind CSS for styling

### Branch Naming Convention

- `feature/feature-name`: For new features
- `fix/issue-description`: For bug fixes
- `docs/documentation-update`: For documentation updates

### Commit Message Convention

We follow the Conventional Commits standard:

- `feat: add new feature`
- `fix: resolve bug issue`
- `docs: update README`
- `style: format code`
- `refactor: restructure code without changing functionality`
- `test: add or update tests`
- `chore: update dependencies`

## Project Structure

```
src/
├── app/              # Next.js 13+ App Router
│   ├── api/          # API routes
│   ├── dashboard/    # Dashboard page
│   ├── inventory/    # Inventory management pages
│   └── ...
├── components/       # Reusable components
│   ├── ui/           # UI components
│   ├── forms/        # Form components
│   ├── chatbot/      # AI chatbot components
│   └── layout/       # Layout components
├── contexts/         # React contexts
├── hooks/            # Custom hooks
├── lib/              # Utility functions
├── services/         # API service connectors
└── types/            # TypeScript interfaces and types
```

## License

This project is proprietary and owned by MS Sports.

## Acknowledgments

- Developed by Synapse Labs
