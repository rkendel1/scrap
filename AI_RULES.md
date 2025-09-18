# AI Rules and Tech Stack Guidelines

This document outlines the core technologies used in this project and provides clear guidelines on which libraries to use for specific functionalities. Adhering to these rules ensures consistency, maintainability, and leverages the strengths of our chosen tech stack.

## 🚀 Tech Stack Overview

1.  **Frontend Framework:** React with TypeScript
2.  **Backend Framework:** Express.js with TypeScript
3.  **Build Tool:** Vite (for frontend)
4.  **Database:** PostgreSQL (for persistent data storage)
5.  **Styling:** Tailwind CSS (utility-first approach)
6.  **UI Components:** shadcn/ui (pre-built, accessible components)
7.  **HTTP Client:** Axios (for both frontend and backend API interactions)
8.  **Form Management (Frontend):** React Hook Form
9.  **HTML/CSS Parsing (Backend):** Cheerio (HTML) and CSS-Tree (CSS)
10. **AI Integration:** OpenAI API (for LLM-powered features)

## 📚 Library Usage Guidelines

To maintain a consistent and efficient codebase, please follow these guidelines for library usage:

*   **Styling:**
    *   **Tailwind CSS:** Always use Tailwind CSS utility classes for all styling. Avoid custom CSS files or inline styles unless absolutely necessary for dynamic, component-specific logic.
    *   **shadcn/ui:** Utilize components from the shadcn/ui library for common UI elements (buttons, inputs, cards, etc.). These components are pre-styled with Tailwind and are designed for accessibility. If a specific shadcn/ui component doesn't fit the need, create a new component using Tailwind classes.

*   **Icons:**
    *   **lucide-react:** Use icons from the `lucide-react` package for all icon needs.

*   **HTTP Requests:**
    *   **Axios:** Use `axios` for all HTTP requests in both the frontend and backend. This ensures a consistent API interaction layer.

*   **Form Handling (Frontend):**
    *   **React Hook Form:** Use `react-hook-form` for managing form state, validation, and submission. This provides a robust and performant solution for forms.

*   **Routing (Frontend):**
    *   **React Router:** Use `react-router-dom` for defining and managing application routes. Keep the main routing configuration in `src/App.tsx`.

*   **State Management (Frontend):**
    *   **React Hooks:** Prefer React's built-in state management (useState, useEffect, useContext) for component-level and shared state. Avoid external state management libraries unless a clear need for global, complex state management arises.

*   **HTML Parsing (Backend):**
    *   **Cheerio:** Use `cheerio` for parsing and manipulating HTML content on the server-side during website extraction.

*   **CSS Parsing (Backend):**
    *   **CSS-Tree:** Use `css-tree` for parsing and analyzing CSS content on the server-side during website extraction.

*   **Database Interaction (Backend):**
    *   **`pg` (node-postgres):** Use the `pg` library for all interactions with the PostgreSQL database. Ensure parameterized queries are used to prevent SQL injection.

*   **Authentication (Backend):**
    *   **`bcryptjs`:** Use `bcryptjs` for hashing and comparing user passwords.
    *   **`jsonwebtoken`:** Use `jsonwebtoken` for generating and verifying JSON Web Tokens (JWTs) for user authentication and secure embed tokens.

*   **AI Integration (Backend):**
    *   **`openai`:** Use the official `openai` package for interacting with OpenAI's Large Language Models (LLMs).

*   **Server Middleware (Backend):**
    *   **`helmet`:** For setting various HTTP headers to secure the Express app.
    *   **`cors`:** For enabling Cross-Origin Resource Sharing.
    *   **`morgan`:** For HTTP request logging.
    *   **`express-rate-limit`:** For limiting repeated requests to public APIs to prevent abuse.

*   **Environment Variables:**
    *   **`dotenv`:** Use `dotenv` to manage environment variables in development. Always access environment variables via `process.env` (backend) or `import.meta.env` (frontend).

*   **File Structure:**
    *   **`src/pages/`:** For top-level application views/pages.
    *   **`src/components/`:** For reusable UI components.
    *   **`src/services/`:** For API interaction logic.
    *   **`src/types/`:** For TypeScript interface definitions.
    *   **`src/utils/`:** For general utility functions.
    *   **New Components/Hooks:** Always create a new file for every new component or hook, no matter how small. Avoid adding new components to existing files.