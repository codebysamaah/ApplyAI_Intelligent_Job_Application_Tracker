# ApplyAI - Intelligent Job Application Tracker

A full-stack job search workspace that combines application tracking, intelligent task management, and AI-powered job analysis to help candidates make better decisions throughout the hiring process.

**ApplyAI** is a production-oriented full-stack web application designed to centralize the modern job search into one workspace. It combines structured application management with AI-powered job description analysis, automated task generation, and analytics.

Instead of treating AI as a simple chatbot, ApplyAI uses AI to **extract structured information from unstructured job postings and communications**, which can then be stored, analyzed, and used by deterministic application logic.

---

## ✨ Why ApplyAI?

Managing a job search often means switching between spreadsheets, job boards, email, calendars, and notes.

ApplyAI brings these workflows together:

```text
Job Posting
     ↓
AI Analysis
     ↓
Structured Requirements
     ↓
Application Tracking
     ↓
Tasks & Deadlines
     ↓
Analytics & Insights
```

The goal is to turn a collection of job applications into an **organized, data-driven workflow**.

---

## 🚀 Features

### 📋 Application Management

Track every application from initial discovery through the hiring process.

* Company and job title
* Application status
* Job type
* Application date
* Application deadline
* Job URL
* Location
* Salary information
* Priority
* Notes
* Application details page

Supported application stages:

```text
Saved → Applied → OA → Interview → Offer
                              ↘ Rejected
```

---

### ✅ Intelligent Task Management

Create and manage tasks associated with individual applications.

Examples:

* Complete coding assessment
* Prepare for technical interview
* Submit take-home assignment
* Follow up with recruiter
* Prepare behavioral interview answers

Tasks support:

* Due dates
* Priority levels
* Completion tracking
* Application association
* Manual task creation
* Task deletion

The system is designed to eventually support automatically generated tasks from AI-extracted deadlines and hiring communications.

---

### 🤖 AI Job Analyzer

ApplyAI analyzes job descriptions and converts unstructured text into structured information.

The analyzer is designed to extract:

* Required skills
* Preferred skills
* Programming languages
* Experience requirements
* Responsibilities
* Location
* Salary information
* Other relevant qualifications

This structured information can then be used by the application to provide a more meaningful assessment of a candidate's fit.

### AI Pipeline

```text
Job Description
       ↓
   OpenAI API
       ↓
Structured JSON
       ↓
Database
       ↓
Matching Logic
       ↓
Candidate Insights
```

Rather than asking an LLM to arbitrarily produce a score, ApplyAI separates **AI extraction** from **deterministic scoring logic**.

This makes the system easier to reason about, test, and extend.

---

### 📊 Analytics

The analytics dashboard is designed to provide insight into the user's job search activity.

Planned metrics include:

* Total applications
* Applications by status
* Applications by job type
* Interview rate
* Offer rate
* Application activity over time
* Upcoming deadlines
* Priority distribution
* AI match score distribution

---

### 📧 AI Email Parser

Planned functionality for extracting actionable information from hiring-related emails.

The system will identify information such as:

* Company
* Position
* Interview date
* Online assessment deadline
* Next action
* Important instructions

Example:

```text
Recruiter Email
      ↓
   AI Parser
      ↓
Structured Event
      ↓
Application
      ↓
Task / Deadline
```

---

## 🏗️ Architecture

ApplyAI follows a full-stack architecture with a clear separation between the user interface, server-side application logic, database layer, and AI services.

```text
┌─────────────────────────────┐
│       Next.js Frontend      │
│                             │
│ React + TypeScript +        │
│ Tailwind CSS                │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│      Application Layer      │
│                             │
│ Next.js API Routes /        │
│ Server-side Logic           │
└───────┬─────────────┬───────┘
        │             │
        ↓             ↓
┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │   OpenAI API │
│              │  │              │
│ Prisma ORM   │  │ AI Analysis  │
└──────────────┘  └──────────────┘
```

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js API Routes
* REST APIs
* Server-side application logic

### Database

* PostgreSQL
* Prisma ORM

### AI

* OpenAI API
* Structured JSON outputs
* Prompt engineering
* LLM-based information extraction

### Testing

* Unit testing
* Integration testing
* End-to-end testing

### Development & Deployment

* Git
* GitHub
* Docker
* Vercel

---

## 🎯 What This Project Demonstrates

ApplyAI was built to demonstrate practical experience across the modern software development stack:

* Full-stack web development
* TypeScript and React development
* Next.js application architecture
* RESTful API design
* Relational database design
* Prisma ORM
* Client-server architecture
* CRUD application development
* AI/LLM integration
* Structured AI outputs
* Prompt engineering
* Data processing
* Automated testing
* Docker containerization
* Cloud deployment
* Git-based development

