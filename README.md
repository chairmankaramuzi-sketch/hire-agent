# AI-Powered Recruitment & CV Screening System

Decision-support recruitment web application for HR teams to evaluate vacancies, screen submitted CVs against structured criteria, and inspect an explainable shortlist with full human-in-the-loop oversight.

## Architecture & Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Schema Validation:** Zod
- **Icons:** Lucide React
- **Testing:** Vitest + React Testing Library
- **Planned Backend:** PostgreSQL, Private Object Storage, Managed Auth, Server Route Handlers

## Getting Started

### Prerequisites

- Node.js LTS (v20+ recommended)
- npm (v10+)

### Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Scripts

- **Start development server:**
  ```bash
  npm run dev
  ```
- **Run TypeScript type checks:**
  ```bash
  npm run type-check
  ```
- **Run linter:**
  ```bash
  npm run lint
  ```
- **Run automated test suite:**
  ```bash
  npm run test
  ```
- **Build production bundle:**
  ```bash
  npm run build
  ```
