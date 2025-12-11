# HCL Internship - SOP Management System

A comprehensive **Standard Operating Procedures (SOP) Management System** built with Django REST Framework and Angular, designed to manage organizational processes, subprocesses, objectives, and associated media files.

## 🚀 Project Overview

This full-stack web application provides a centralized platform for managing organizational processes, allowing administrators to create hierarchical process structures and assign them to users. The system supports document, video, and image uploads for each objective, enabling comprehensive SOP documentation.

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 4.2.23
- **API**: Django REST Framework
- **Authentication**: JWT (JSON Web Tokens) using `djangorestframework-simplejwt`
- **Database**: MySQL
- **File Storage**: Django FileField/ImageField with media handling
- **CORS**: django-cors-headers

### Frontend
- **Framework**: Angular 20.3.0
- **Language**: TypeScript
- **HTTP Client**: Angular HttpClient
- **Routing**: Angular Router with Route Guards
- **Styling**: Custom CSS with responsive design

## 📋 Features

### 🔐 Authentication & Authorization
- JWT-based user authentication (Login/Register)
- Role-based access control (Admin/User)
- Protected routes with authentication guards
- User profile management

### 👥 User Management
- User registration and login
- User CRUD operations (Create, Read, Update, Delete)
- User status management (Active/Inactive)
- Role assignment (Admin/User)
- User assignment to processes and subprocesses
- User dashboard with assigned work view

### 📊 Process Management
- **Process Master**: Create, read, update, and delete processes
- **SubProcess Master**: Manage subprocesses linked to processes with URL links
- **Objective Master**: Create objectives linked to processes and subprocesses
- Hierarchical structure: Process → SubProcess → Objective

### 📎 Media Management
- **Documents**: Upload and manage documents (PDF, DOC, DOCX, TXT) for objectives
- **Videos**: Add video URLs (YouTube, Google Drive, etc.) to objectives
- **Images**: Upload and display images in a responsive grid layout
- Tabbed interface for easy media navigation
- Media deletion and viewing capabilities

### 🎨 User Interface
- Modern, responsive design
- Role-based navigation (Admin sees all modules, Users see assigned work)
- Interactive dashboards
- Real-time form validation
- Success/error message handling
- Pagination and search functionality

## 📁 Project Structure

```
ProjectPractical/
├── DjangoServer/
│   └── Backend/
│       ├── api/              # Main application
│       │   ├── models.py     # Database models
│       │   ├── views.py      # API endpoints
│       │   ├── serializers.py # Data serialization
│       │   └── urls.py       # URL routing
│       ├── back/             # Django project settings
│       └── manage.py
│
└── project/
    └── my-ui-app/            # Angular frontend
        └── src/
            └── app/
                ├── components/    # Angular components
                ├── services/     # API services
                ├── guards/       # Route guards
                └── routes/       # Application routes
```

## 🗄️ Database Models

1. **UserExtra**: Extended user model with phone, status, role, and assignments
2. **Process**: Main process entities
3. **SubProcess**: Subprocesses linked to processes
4. **Objective**: Objectives linked to processes and subprocesses
5. **Document**: Document files linked to objectives
6. **Video**: Video URLs linked to objectives
7. **Image**: Image files linked to objectives

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `GET /api/auth/profile/` - Get user profile

### User Management
- `GET /api/auth/users/` - List all users
- `PUT /api/auth/users/<id>/update/` - Update user
- `DELETE /api/auth/users/<id>/delete/` - Delete user
- `PATCH /api/auth/users/<id>/toggle-status/` - Toggle user status
- `PATCH /api/auth/users/<id>/role/` - Update user role
- `POST /api/auth/users/<id>/assign/` - Assign processes to user
- `GET /api/auth/users/<id>/assignments/` - Get user assignments

### Process Management
- `POST /api/auth/process/create/` - Create process
- `GET /api/auth/process/list/` - List all processes
- `PUT /api/auth/process/<id>/update/` - Update process
- `DELETE /api/auth/process/<id>/delete/` - Delete process

### SubProcess Management
- `POST /api/auth/subprocess/create/` - Create subprocess
- `GET /api/auth/subprocess/list/` - List all subprocesses
- `PUT /api/auth/subprocess/<id>/update/` - Update subprocess
- `DELETE /api/auth/subprocess/<id>/delete/` - Delete subprocess

### Objective Management
- `POST /api/auth/objective/create/` - Create objective
- `GET /api/auth/objective/list/` - List all objectives
- `PUT /api/auth/objective/<id>/update/` - Update objective
- `DELETE /api/auth/objective/<id>/delete/` - Delete objective

### Media Management
- **Documents**:
  - `POST /api/auth/document/upload/` - Upload document
  - `GET /api/auth/document/<objective_id>/list/` - List documents
  - `DELETE /api/auth/document/<id>/delete/` - Delete document

- **Videos**:
  - `POST /api/auth/video/create/` - Add video
  - `GET /api/auth/video/<objective_id>/list/` - List videos
  - `DELETE /api/auth/video/<id>/delete/` - Delete video

- **Images**:
  - `POST /api/auth/image/upload/` - Upload image
  - `GET /api/auth/image/<objective_id>/list/` - List images
  - `DELETE /api/auth/image/<id>/delete/` - Delete image

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- MySQL 8.0+
- Angular CLI 20+

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd DjangoServer/Backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install django djangorestframework djangorestframework-simplejwt django-cors-headers mysqlclient Pillow
   ```

3. **Configure MySQL database**:
   - Update database credentials in `back/settings.py`
   - Create database named `HCL`

4. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser** (optional):
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server**:
   ```bash
   python manage.py runserver
   ```
   Server runs on `http://127.0.0.1:8000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd project/my-ui-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   ng serve
   ```
   Application runs on `http://localhost:4200`

## 🔒 Security Features

- JWT token-based authentication
- Password hashing
- CORS configuration for cross-origin requests
- Route guards for protected pages
- Role-based access control
- Input validation and sanitization

## 📱 User Roles

### Admin
- Full access to all modules
- User management
- Process/SubProcess/Objective management
- Assign processes to users
- Media management

### User
- View assigned processes and subprocesses
- Access assigned SOP documents, videos, and images
- View personal dashboard

## 🎯 Key Functionalities

1. **Hierarchical Process Management**: Create and manage processes, subprocesses, and objectives in a structured hierarchy
2. **Media Organization**: Upload and organize documents, videos, and images for each objective
3. **User Assignment**: Assign specific processes and subprocesses to users
4. **Role-Based Dashboard**: Different views for admin and regular users
5. **Real-time Updates**: Dynamic UI updates without page refresh
6. **File Management**: Secure file upload and storage system

## 🐛 Troubleshooting

### CORS Issues
- Ensure CORS settings in `back/settings.py` allow your frontend origin
- Check that `django-cors-headers` is properly installed and configured

### Database Connection
- Verify MySQL credentials in `settings.py`
- Ensure MySQL server is running
- Check database exists and user has proper permissions

### Port Conflicts
- Backend default port: 8000
- Frontend default port: 4200
- Use `--port` flag to specify different ports if needed

## 📝 License

This project was developed as part of HCL Internship program.

## 👨‍💻 Developer

**Keshav Bisht**
- Developed during HCL Internship
- Full-stack development with Django and Angular

## 🔮 Future Enhancements

- [ ] Email notifications for assignments
- [ ] Advanced search and filtering
- [ ] Export functionality (PDF, Excel)
- [ ] Version control for documents
- [ ] Comments and collaboration features
- [ ] Analytics and reporting dashboard
- [ ] Mobile responsive improvements
- [ ] Dark mode support

---

**Note**: This is a development project. For production deployment, ensure to:
- Set `DEBUG = False`
- Configure proper `ALLOWED_HOSTS`
- Use environment variables for sensitive data
- Set up proper file storage (AWS S3, etc.)
- Configure HTTPS
- Implement rate limiting
- Add comprehensive error logging
