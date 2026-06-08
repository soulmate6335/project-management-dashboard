# Project Management Dashboard

# 🚀 Project Hub

Project Hub is a full-stack project management and team collaboration platform that helps teams organize projects, manage tasks, track progress, and collaborate in real-time.

The application provides project tracking, task management, role-based access control, analytics, and real-time communication features to improve team productivity and project delivery.

---

## 📌 Features

### Authentication & Authorization
- User registration
- User login
- JWT authentication
- Protected routes
- Role-based access control
- Secure password hashing

### Project Management
- Create projects
- Edit project details
- Archive projects
- View project progress
- Manage project members
- Project ownership system

### Task Management
- Create tasks
- Update tasks
- Delete tasks
- Task status management
- Task priorities
- Task assignments
- Due dates
- Task ordering and reordering
- Task summaries and analytics

### Real-Time Collaboration
- Socket.IO integration
- Live task updates
- Real-time notifications
- Multi-user collaboration

### Dashboard & Analytics
- Project overview
- Task statistics
- Progress tracking
- Status summaries
- Productivity insights

### User Experience
- Responsive design
- Modern Material UI interface
- Loading states
- Error handling
- Toast notifications
- Dark mode support

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Material UI (MUI)
- React Router
- React Query
- Redux Toolkit
- React Hook Form
- Axios
- Socket.IO Client
- React Hot Toast

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- Socket.IO
- JWT Authentication
- Bcrypt

### Database
- MongoDB Atlas

---

## 📂 Project Structure

```
project-hub/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   └── package.json
│
└── README.md
```

---

## 🔐 User Roles

### Admin
- Manage all projects
- Manage users
- View analytics
- Monitor system activities

### Member
- Create tasks
- Update assigned tasks
- Collaborate on projects

### Viewer
- View project information
- View tasks
- Read-only access

---

## 📊 Task Workflow

Tasks move through the following stages:

```text
To Do
   ↓
In Progress
   ↓
In Review
   ↓
Done
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com//project-hub.git
cd project-hub
```

---

## Backend Setup

Navigate to backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

NODE_ENV=development

CLIENT_URL=http://localhost:5173

JWT_SECRET=your_jwt_secret

MONGODB_URI=your_mongodb_connection_string
```

Start backend:

```bash
npm run dev
```

---

## Frontend Setup

Navigate to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend:

```bash
npm run dev
```

---

## 🔄 API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

### Projects

```http
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

### Tasks

```http
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
GET    /api/projects/:projectId/tasks/:id
PATCH  /api/projects/:projectId/tasks/:id
DELETE /api/projects/:projectId/tasks/:id
PATCH  /api/projects/:projectId/tasks/reorder
```

---

## 📈 Future Improvements

- File uploads
- Team chat system
- Calendar integration
- Email notifications
- Notifications in dashboard
- Mobile application
- Advanced reporting
- AI-powered task suggestions

---

## 🎯 Purpose of the Project

Project Hub was developed to provide a centralized platform where teams can:

- Plan projects
- Organize tasks
- Monitor project progress
- Collaborate in real time
- Improve communication
- Increase productivity