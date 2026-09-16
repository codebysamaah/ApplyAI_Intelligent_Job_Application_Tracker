# ApplyAI – Intelligent Job Application Tracker

ApplyAI is an AI-powered job application tracker designed to help users organize applications, analyze job postings, identify skill gaps, and generate tailored resumes.

## Features

* **Application Tracking** – Create, update, and manage job applications in one place.
* **AI Job Analyzer** – Analyze job descriptions to extract required skills, programming languages, experience, location, salary, and responsibilities.
* **Job Match Scoring** – Compare your profile against job requirements and identify skill gaps.
* **AI Resume Builder** – Generate tailored resumes based on your profile and a specific job posting.
* **Profile Management** – Store education, skills, projects, experience, certifications, and achievements.
* **Task Management** – Create and track application-related tasks and deadlines.
* **Dashboard & Analytics** – View application statuses and track your job search progress.
* **Authentication** – Secure user accounts with password hashing and HTTP-only JWT authentication.

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js API Routes
* Node.js
* Prisma ORM
* PostgreSQL

### AI / Machine Learning

* Google Gemini API
* LLM-powered job analysis
* Resume generation
* Skill matching and gap analysis

### Tools & Deployment

* Docker
* Vercel
* Git & GitHub

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/codebysamaah/ApplyAI_Intelligent_Job_Application_Tracker.git
cd ApplyAI_Intelligent_Job_Application_Tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL="your-postgresql-database-url"
GEMINI_API_KEY="your-gemini-api-key"
AUTH_SECRET="your-random-auth-secret"
```

Do not commit `.env.local` to GitHub.

### 4. Set up Prisma

Generate the Prisma client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

### 5. Start the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Docker

Build the Docker image:

```bash
docker build -t applyai .
```

Run the container:

```bash
docker run -p 3000:3000 --env-file .env.local applyai
```

Then open http://localhost:3000.

## Production Deployment

ApplyAI can be deployed using Vercel.

Add the following environment variables to your Vercel project:

```text
DATABASE_URL
GEMINI_API_KEY
AUTH_SECRET
```

Vercel will automatically build and deploy the Next.js application when connected to the GitHub repository.

## Project Structure

```text
app/
├── api/
│   ├── applications/
│   ├── auth/
│   ├── dashboard/
│   ├── profile/
│   ├── resume-builder/
│   ├── tasks/
│   └── ...
├── applications/
├── profile/
└── ...

components/
lib/
├── auth.ts
└── prisma.ts

prisma/
└── schema.prisma

public/
Dockerfile
next.config.ts
package.json
```

## Security

* Passwords are hashed using bcrypt.
* Authentication uses HTTP-only JWT cookies.
* User-specific application and profile data is protected through server-side ownership checks.
* API keys and database credentials are stored in environment variables and are not committed to the repository.

## Future Improvements

* Resume template customization
* Additional AI-powered career recommendations
* Application reminders and notifications
* More detailed job-search analytics
* Resume export and formatting improvements
* Additional AI models and providers

## License

This project is for educational and portfolio purposes.
