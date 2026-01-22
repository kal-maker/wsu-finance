# Full Stack AI Fianace Platform with Next JS, Supabase, Tailwind, Prisma, Inngest, ArcJet, Shadcn UI Tutorial 
## https://youtu.be/egS6fnZAdzk

<img width="1470" alt="Screenshot 2024-12-10 at 9 45 45 AM" src="https://github.com/user-attachments/assets/1bc50b85-b421-4122-8ba4-ae68b2b61432">

### Make sure to create a `.env` file with following variables -

```
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

GEMINI_API_KEY=

RESEND_API_KEY=

ARCJET_KEY=
```

## 📌 Project Abstract
This project is a comprehensive **Personal Finance Management System** designed to help users track expenses, manage budgets, and gain financial insights. Unlike traditional finance apps, this platform leverages **Artificial Intelligence (Google Gemini & Custom ML Models)** to automate receipt scanning and transaction categorization, significantly reducing manual data entry efforts. It features a responsive web interface and a native Android application, ensuring users can manage their finances from anywhere.

---

## 🚀 Key Objectives
1.  **Automation**: Eliminate manual data entry for transactions using OCR and ML.
2.  **Insight**: Provide clear, visual analytics of financial health (Income vs. Expenses).
3.  **Cross-Platform Access**: seamless experience on both Web and Mobile (Android).
4.  **Security**: Robust data protection using modern authentication and security protocols.

---


## ✨ Key Features

1.  **Smart Dashboard**: Real-time overview of total balance, income, expenses, and recent transactions.
2.  **AI Receipt Scanning**: Upload a receipt image, and the system extracts date, amount, merchant, and line items using Google Gemini.
3.  **Automatic Categorization**: Transactions are automatically classified (e.g., "Starbucks" -> "Food & Dining") using a Python-based Machine Learning model.
4.  **Recurring Transactions**: Set up monthly bills (rent, subscriptions) that are automatically processed.
5.  **Multi-Account Support**: Manage Checking, Savings, and Credit Card accounts in one place.
6.  **Secure Authentication**: Google Account and Email/Password login via Clerk.
7.  **Responsive Design**: Mobile-friendly web interface plus a dedicated Android app.

---

## 🏛️ System Architecture

1.  **User Client**: Interacts with the **Next.js Web App** or **Android App**.
2.  **API Layer**: 
    *   **Next.js Server Actions** handle core logic (CRUD for Transactions, Accounts).
    *   **FastAPI Service** exposes endpoints (`/predict`) for the ML classification model.
3.  **Database Layer**: Centralized **SQL Database** stores all user data.
4.  **External Services**:
    *   **Clerk**: Validates user sessions.
    *   **Google Gemini**: Processes images.
    *   **Nodemailer**: Sends email notifications.

---

## 💻 Setup & Installation Guide

### Prerequisites
-   Node.js & npm
-   Python 3.8+
-   Android Studio (for mobile app)

### 1. Web Application (Next.js)
```bash
# Install dependencies
npm install

# Setup Environment Variables
# (See .env.example)

# Initialize Database
npx prisma generate
npx prisma db push

# Run Development Server
npm run dev
```
*Access the web app at `http://localhost:3000`*

### 2. ML Service (Python)
```bash
cd backend

# Create virtual environment
python -m venv venv
# Activate: venv\Scripts\activate (Windows) or source venv/bin/activate (Mac/Linux)

# Install requirements
pip install -r requirements.txt

# Start Server
npm run fastapi
# OR manually: uvicorn app.main:app --reload --port 8001
```

### 3. Android Application
1.  Open the `Android2` folder in **Android Studio**.
2.  Sync Gradle files.
3.  Run on an Emulator or Physical Device.
    *   *Note: Ensure the Android device is on the same network or use `adb reverse tcp:3000 tcp:3000` to access localhost.*

