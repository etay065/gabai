# 🕍 Gab-AI

מערכת חכמה לניהול תפילות ובקשות שבת.

## ארכיטקטורה

```
shul-app/
├── server/          Node.js + Express + MongoDB (Mongoose)
│   ├── models/      User, Request, Schedule, Settings
│   ├── routes/      auth, requests, schedule, settings
│   └── middleware/  JWT auth
└── client/          React 18 + React Query + React Router
    └── src/
        ├── pages/   Landing, GabaiLogin, GabaiDashboard, MemberDashboard
        ├── components/  UI components (Card, Badge, Button...)
        ├── context/ AuthContext (JWT session)
        └── api/     axios client
```

## התקנה

### דרישות מוקדמות
- Node.js 18+
- MongoDB מותקן ורץ מקומית (או MongoDB Atlas)

### 1. שכפל את הפרויקט

```bash
git clone <repo>
cd shul-app
```

### 2. הגדר משתני סביבה לשרת

```bash
cp server/.env.example server/.env
```

ערוך את `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shul-app
JWT_SECRET=בחר_מחרוזת_סודית_ארוכה_וחזקה
JWT_EXPIRES_IN=30d
```

לשימוש עם MongoDB Atlas:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/shul-app
```

### 3. התקן dependencies

```bash
npm run install:all
```

### 4. הפעל בסביבת פיתוח

```bash
npm run dev
```

- **Client**: http://localhost:3000
- **Server API**: http://localhost:5000/api

---

## משתמש ברירת מחדל לגבאי

| שדה | ערך |
|-----|-----|
| שם משתמש | `gabai` |
| סיסמה | `1234` |

> שנה את הסיסמה דרך הגדרות הגבאי לאחר הכניסה הראשונה!

---

## API Endpoints

### Auth
| Method | Path | תיאור | הגנה |
|--------|------|--------|-------|
| POST | `/api/auth/login` | כניסת גבאי | — |
| POST | `/api/auth/change-password` | שינוי סיסמה | JWT |
| GET  | `/api/auth/me` | פרטי משתמש נוכחי | JWT |

### Requests
| Method | Path | תיאור | הגנה |
|--------|------|--------|-------|
| GET  | `/api/requests` | רשימת בקשות (query: memberName, day, status) | — |
| GET  | `/api/requests/stats` | סטטיסטיקות | JWT |
| POST | `/api/requests` | הגשת בקשה חדשה | — |
| PATCH | `/api/requests/:id/status` | עדכון סטטוס | JWT |
| DELETE | `/api/requests/:id` | מחיקת בקשה | JWT |

### Schedule
| Method | Path | תיאור | הגנה |
|--------|------|--------|-------|
| GET  | `/api/schedule` | לוח כל הימים | — |
| GET  | `/api/schedule/:day` | לוח יום ספציפי (0-6) | — |
| PUT  | `/api/schedule/:day` | עדכון לוח יום | JWT |

### Settings
| Method | Path | תיאור | הגנה |
|--------|------|--------|-------|
| GET | `/api/settings` | קריאת הגדרות | — |
| PUT | `/api/settings` | עדכון הגדרות | JWT |

---

## Build לפרודקשן

```bash
# Build client
cd client && npm run build

# הגש את ה-build דרך Express:
# הוסף לserver/index.js:
# app.use(express.static(path.join(__dirname, '../client/build')));
# app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
```

## Deploy

### Render / Railway / Fly.io
1. הגדר `MONGODB_URI` ו-`JWT_SECRET` כ-environment variables
2. Build command: `npm run install:all && cd client && npm run build`
3. Start command: `cd server && node index.js`

### Docker (אופציונלי)
ניתן להוסיף `Dockerfile` בהתאם לצורך.
