# Alexandria - Mentorship MVP platform

## Project Structure

*   `backend/`: Native PHP API (no frameworks).
*   `frontend/`: Vue.js 3 + Vite.
*   `database/`: SQL schema.

## Setup Instructions

### 1. Database Setup

1.  Ensure you have MySQL running.
2.  Create a database named `alexandria_db`.
3.  Import the schema from `database/schema.sql`.
    *   Command line example: `mysql -u root -p < database/schema.sql` (Adjust user/pass as needed).
    *   **Note:** The `backend/db.php` file is configured for `root` user with no password on `localhost`. Edit this file if your MySQL credentials differ.

### 2. Backend Setup

1.  Navigate to the `backend/` directory.
2.  Start the PHP built-in server on port 8000:
    ```bash
    cd backend
    php -S localhost:8000
    ```

### 3. Frontend Setup

1.  Navigate to the `frontend/` directory.
2.  Install dependencies (if not already done):
    ```bash
    cd frontend
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## Usage

1.  Open the frontend URL (usually `http://localhost:5173`).
2.  **Register** a new account.
    *   By default, new accounts have `is_active = 0` (inactive) and `role = 'student'`.
    *   You will be redirected to the `/checkout` page upon login if inactive.
3.  **Activate User (Manual Step for Testing)**:
    *   Go to your database and update the `users` table:
        ```sql
        UPDATE users SET is_active = 1 WHERE email = 'your@email.com';
        ```
    *   Now login again to access the `/home` dashboard.
4.  **Admin Access**:
    *   To access the Admin panel, manually set a user's role to 'admin' in the database:
        ```sql
        UPDATE users SET role = 'admin', is_active = 1 WHERE email = 'admin@email.com';
        ```
    *   Login and you will be redirected to `/admin` (or navigate there manually).
