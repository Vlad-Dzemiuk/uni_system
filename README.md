# Uni System — портал довідок та заявок (frontend + backend)

## Стек

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind UI (`frontend/`)
- **Backend**: Node.js + Express + MongoDB (Mongoose) (`backend/`)

## Структура

- `frontend/` — клієнтський застосунок + Next API routes (проксі до бекенду)
- `backend/` — REST API (`/api/*`) + авторизація + робота з MongoDB

## Перший запуск (Windows / PowerShell)

### 1) Backend

1. Встановіть залежності:

```bash
cd backend
npm i
```

2. Створіть файл `backend/.env` (мінімальний приклад):

```env
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/uni_system

JWT_SECRET=change_me_to_a_long_random_secret_32chars_min
JWT_EXPIRES_IN=30d

# Дозволений домен для Google‑акаунтів
ALLOWED_EMAIL_DOMAIN=oa.edu.ua

# URL фронтенду (для редіректів після логіну)
FRONTEND_URL=http://localhost:3000

# CORS (через кому)
CORS_ORIGINS=http://localhost:3000

# Google OAuth (обовʼязково для входу через кнопку "Continue with Google")
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# (опційно) кому призначати Admin автоматично
BOOTSTRAP_ADMIN_EMAILS=admin@oa.edu.ua
```

3. Запустіть бекенд:

```bash
npm run dev
```

Перевірка: `GET http://localhost:3001/health`.

### 2) Frontend

1. В іншому терміналі:

```bash
cd frontend
npm i
```

2. Створіть `frontend/.env.local`:

```env
# URL бекенду
NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. Запустіть фронтенд:

```bash
npm run dev
```

Відкрийте `http://localhost:3000` і виконайте вхід через Google.

## Нотатки

- Якщо бекенд і фронтенд запустити на одному порту (за замовчуванням у бекенді `PORT=3000`) — буде конфлікт. Для dev рекомендовано **backend: 3001**, **frontend: 3000**.
- Для роботи логіну потрібні коректні **Google OAuth** креденшали та `GOOGLE_REDIRECT_URI`, що збігається з налаштуваннями у Google Cloud Console.

