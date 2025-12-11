# Technical Deep Dive - SOP Management System

## 📚 Table of Contents
1. [System Architecture](#system-architecture)
2. [Data Flow & Request Lifecycle](#data-flow--request-lifecycle)
3. [Authentication & Authorization Flow](#authentication--authorization-flow)
4. [Database Schema & Relationships](#database-schema--relationships)
5. [Backend Implementation Details](#backend-implementation-details)
6. [Frontend Implementation Details](#frontend-implementation-details)
7. [API Communication Layer](#api-communication-layer)
8. [File Upload Mechanism](#file-upload-mechanism)
9. [Role-Based Access Control](#role-based-access-control)
10. [State Management](#state-management)
11. [Error Handling Strategy](#error-handling-strategy)
12. [Security Implementation](#security-implementation)

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Angular 20 SPA (Frontend)                    │   │
│  │  - Components, Services, Guards, Routes               │   │
│  │  - HTTP Client, RxJS Observables                      │   │
│  │  - LocalStorage for Token Management                  │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST API
                        │ JWT Tokens
                        │ JSON Data
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Django REST Framework (Backend)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Views → Serializers → Models → Database         │   │
│  │  - JWT Authentication                                 │   │
│  │  - CORS Middleware                                    │   │
│  │  - File Upload Handling                               │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ SQL Queries
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    MySQL Database                            │
│  - User, UserExtra, Process, SubProcess, Objective          │
│  - Document, Video, Image                                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture (Frontend)

```
Angular Application
│
├── Layout Component (Main Wrapper)
│   ├── Sidebar Component (Navigation)
│   └── Router Outlet (Dynamic Content)
│
├── Authentication Module
│   ├── Login Component
│   ├── Register Component
│   └── Auth Service (JWT Management)
│
├── Dashboard Module
│   ├── Dashboard Component (User Management)
│   └── User CRUD Operations
│
├── Process Management Module
│   ├── Process Component (CRUD)
│   ├── SubProcess Component (CRUD)
│   └── Objective Component (CRUD + Media)
│
└── Assigned Work Module
    └── Assigned Component (User's View)
```

---

## 🔄 Data Flow & Request Lifecycle

### Complete Request Flow Example: Creating an Objective

#### Step 1: User Interaction (Frontend)
```typescript
// User fills form and clicks "Create Objective"
// objective.component.ts
saveObjective() {
  const body = {
    process_id: this.selectedProcess,
    subprocess_id: this.selectedSubprocess,
    objective_name: this.objectiveName,
    status: this.status ? "active" : "inactive"
  };
  
  // HTTP POST request
  this.http.post(`${this.apiBase}/objective/create/`, body)
    .subscribe({
      next: () => {
        this.successMessage = "Objective created successfully!";
        this.loadObjectives(); // Refresh list
      }
    });
}
```

#### Step 2: HTTP Request (Network Layer)
```
POST http://127.0.0.1:8000/api/auth/objective/create/
Headers:
  Content-Type: application/json
  Authorization: Bearer <JWT_ACCESS_TOKEN>
Body:
  {
    "process_id": 3,
    "subprocess_id": 12,
    "objective_name": "Implement Security Protocols",
    "status": "active"
  }
```

#### Step 3: CORS Middleware (Backend)
```python
# back/settings.py
CORS_ALLOW_ALL_ORIGINS = True  # Development
CORS_ALLOW_CREDENTIALS = True
# Validates origin, adds CORS headers to response
```

#### Step 4: Authentication Middleware
```python
# Django checks JWT token in Authorization header
# rest_framework_simplejwt validates token
# If valid: request.user is set
# If invalid: Returns 401 Unauthorized
```

#### Step 5: URL Routing
```python
# back/urls.py
path('api/auth/', include('api.urls'))

# api/urls.py
path('objective/create/', views.create_objective)
```

#### Step 6: View Processing
```python
# api/views.py
@api_view(['POST'])
@permission_classes([AllowAny])  # In production: IsAuthenticated
def create_objective(request):
    # Extract data from request
    process_id = request.data.get("process_id")
    subprocess_id = request.data.get("subprocess_id")
    objective_name = request.data.get("objective_name")
    
    # Validate required fields
    if not (process_id and subprocess_id and objective_name):
        return Response({"error": "Missing required fields"}, status=400)
    
    # Fetch related objects
    process = get_object_or_404(Process, process_id=process_id)
    subprocess = get_object_or_404(SubProcess, subprocess_id=subprocess_id)
    
    # Create database record
    objective = Objective.objects.create(
        process=process,
        subprocess=subprocess,
        objective_name=objective_name,
        status="active"
    )
    
    # Return success response
    return Response({
        "message": "Objective created successfully",
        "objective": {
            "id": objective.objective_id,
            "name": objective.objective_name
        }
    }, status=201)
```

#### Step 7: Database Operation
```sql
-- Django ORM generates and executes:
INSERT INTO api_objective 
  (process_id, subprocess_id, objective_name, status, created_at, updated_at)
VALUES 
  (3, 12, 'Implement Security Protocols', 'active', NOW(), NOW());
```

#### Step 8: Response Back to Frontend
```json
{
  "message": "Objective created successfully",
  "objective": {
    "id": 15,
    "name": "Implement Security Protocols"
  }
}
```

#### Step 9: Frontend Update
```typescript
// Angular receives response
.subscribe({
  next: () => {
    this.successMessage = "Objective created successfully!";
    this.loadObjectives(); // Makes another GET request to refresh list
    this.clearObjectiveForm(); // Reset form
  }
});
```

---

## 🔐 Authentication & Authorization Flow

### Complete Authentication Flow

#### 1. User Registration Flow

```
User → Register Form → POST /api/auth/register/
                      ↓
              Backend validates data
                      ↓
              Creates User + UserExtra
                      ↓
              Generates JWT tokens
                      ↓
              Returns tokens + user data
                      ↓
Frontend stores in localStorage
```

**Backend Implementation:**
```python
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    # Validate input using serializer
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        # Create Django User
        user = serializer.save()  # Password is hashed automatically
        
        # Create UserExtra profile
        phone = request.data.get("phone")
        UserExtra.objects.create(
            user=user,
            phone=phone,
            status="active",
            role="user"  # Default role
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=201)
```

**Frontend Implementation:**
```typescript
// register.component.ts
register() {
  const payload = {
    username: this.form.username,
    email: this.form.email,
    password: this.form.password,
    password_confirm: this.form.passwordConfirm,
    first_name: this.form.firstName,
    last_name: this.form.lastName,
    phone: this.form.phone
  };
  
  this.http.post("http://127.0.0.1:8000/api/auth/register/", payload)
    .subscribe({
      next: (response: any) => {
        // Store tokens
        localStorage.setItem('access_token', response.tokens.access);
        localStorage.setItem('refresh_token', response.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirect to dashboard
        this.router.navigate(['/dashboard']);
      }
    });
}
```

#### 2. User Login Flow

```
User → Login Form → POST /api/auth/login/
                   ↓
           Backend authenticates
                   ↓
           Validates credentials
                   ↓
           Fetches user role
                   ↓
           Generates JWT tokens
                   ↓
           Returns tokens + user + role
                   ↓
Frontend stores in localStorage
```

**Backend Implementation:**
```python
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']  # Authenticated user
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Fetch role from UserExtra
        try:
            role = user.extra.role  # Using related_name="extra"
        except UserExtra.DoesNotExist:
            role = "user"  # Default
        
        return Response({
            'user': UserSerializer(user).data,
            'role': role,  # Important for frontend
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=200)
```

**Login Serializer (Custom Validation):**
```python
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        # Find user by email
        try:
            user = User.objects.get(email=email)
            # Authenticate with username and password
            user = authenticate(username=user.username, password=password)
            
            if user is None:
                raise serializers.ValidationError('Invalid credentials')
                
            data['user'] = user
            return data
            
        except User.DoesNotExist:
            raise serializers.ValidationError('User not found')
```

#### 3. Protected Route Access Flow

```
User navigates to /dashboard
        ↓
AuthGuard checks authentication
        ↓
Is token in localStorage?
        ↓
    NO → Redirect to /login
        ↓
    YES → Check token validity
        ↓
    Invalid → Redirect to /login
        ↓
    Valid → Allow access
```

**Route Guard Implementation:**
```typescript
// guards/auth.guard.ts
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}
```

**Auth Service:**
```typescript
isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}
```

#### 4. JWT Token Structure

**Access Token Payload:**
```json
{
  "token_type": "access",
  "exp": 1733673600,  // Expiration timestamp
  "iat": 1733667600,  // Issued at
  "jti": "abc123...", // JWT ID
  "user_id": 5        // User identifier
}
```

**Token Usage:**
```typescript
// Angular automatically includes token in requests
// via HTTP Interceptor (if configured) or manually:

const headers = new HttpHeaders({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
});

this.http.get(url, { headers }).subscribe(...);
```

---

## 🗄️ Database Schema & Relationships

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │ (Django's built-in)
│─────────────│
│ id (PK)     │
│ username    │◄──────┐
│ email       │       │
│ password    │       │
│ first_name  │       │ OneToOne
│ last_name   │       │
└─────────────┘       │
                      │
┌─────────────┐       │
│  UserExtra  │       │
│─────────────│       │
│ id (PK)     │       │
│ user_id (FK)├───────┘
│ phone       │
│ status      │
│ role        │
│ assigned_   │
│  processes  │ (JSON)
│ assigned_   │
│  subprocess │ (JSON)
└─────────────┘

┌─────────────┐
│   Process   │
│─────────────│
│ process_id  │◄──────┐
│ process_name│       │
│ status      │       │ ForeignKey
│ created_at  │       │
│ updated_at  │       │
└─────────────┘       │
                      │
┌─────────────┐       │
│ SubProcess  │       │
│─────────────│       │
│ subprocess_ │       │
│   id (PK)   │       │
│ process_id  ├───────┘
│ subprocess_ │
│   name      │
│ status      │
│ link        │
│ created_at  │
│ updated_at  │
└─────────────┘
      │
      │ ForeignKey (2)
      │
┌─────▼─────────────┐
│   Objective       │
│───────────────────│
│ objective_id (PK) │
│ process_id (FK)   ├───┐
│ subprocess_id(FK) ├───┘
│ objective_name    │
│ status            │
│ created_at        │
│ updated_at        │
└───────────────────┘
      │
      │ ForeignKey (3 separate)
      │
      ├───► Document
      │    │ document_id (PK)
      │    │ objective_id (FK)
      │    │ title
      │    │ file (FileField)
      │    │ created_at
      │
      ├───► Video
      │    │ video_id (PK)
      │    │ objective_id (FK)
      │    │ title
      │    │ video_url
      │    │ created_at
      │
      └───► Image
           │ image_id (PK)
           │ objective_id (FK)
           │ title
           │ image (ImageField)
           │ created_at
```

### Model Relationships Explained

#### 1. User ↔ UserExtra (OneToOne)
```python
# UserExtra model
user = models.OneToOneField(
    User, 
    on_delete=models.CASCADE, 
    related_name="extra"
)
```
**How it works:**
- Each User can have exactly one UserExtra profile
- Access: `user.extra.role` or `userextra.user.username`
- If user is deleted, UserExtra is automatically deleted (CASCADE)

#### 2. Process → SubProcess (OneToMany)
```python
# SubProcess model
process = models.ForeignKey(
    Process,
    on_delete=models.CASCADE,
    related_name="subprocesses"
)
```
**How it works:**
- One Process can have many SubProcesses
- Access: `process.subprocesses.all()` or `subprocess.process.process_name`
- If process is deleted, all subprocesses are deleted (CASCADE)

#### 3. SubProcess → Objective (OneToMany via ForeignKey)
```python
# Objective model
subprocess = models.ForeignKey(
    SubProcess,
    on_delete=models.CASCADE,
    related_name="objectives"
)
```
**Note:** Objective also has a ForeignKey to Process for easier querying:
```python
process = models.ForeignKey(
    Process,
    on_delete=models.CASCADE,
    related_name="objectives"
)
```

#### 4. Objective → Media (OneToMany)
```python
# Document, Video, Image models
objective = models.ForeignKey(
    Objective,
    on_delete=models.CASCADE,
    related_name="documents"  # or "videos" or "images"
)
```

### Database Queries Examples

#### Fetching Process with SubProcesses
```python
# Backend
process = Process.objects.get(process_id=1)
subprocesses = process.subprocesses.all()  # Using related_name

# Generated SQL:
# SELECT * FROM api_subprocess WHERE process_id = 1;
```

#### Fetching Objective with All Media
```python
objective = Objective.objects.get(objective_id=5)
documents = objective.documents.all()
videos = objective.videos.all()
images = objective.images.all()
```

#### User Assignment Query
```python
# UserExtra stores process/subprocess IDs as JSON
user_extra = UserExtra.objects.get(user_id=5)
process_ids = user_extra.assigned_processes  # [1, 3, 5]
subprocess_ids = user_extra.assigned_subprocesses  # [10, 12, 15]

# Fetch actual objects
processes = Process.objects.filter(process_id__in=process_ids)
subprocesses = SubProcess.objects.filter(subprocess_id__in=subprocess_ids)
```

---

## 🔧 Backend Implementation Details

### Request Processing Pipeline

```
HTTP Request
    ↓
CORS Middleware (django-cors-headers)
    ↓
Security Middleware
    ↓
Session Middleware
    ↓
Common Middleware
    ↓
CSRF Middleware
    ↓
Authentication Middleware (JWT)
    ↓
Message Middleware
    ↓
URL Routing (urls.py)
    ↓
View Function (@api_view decorator)
    ↓
Permission Check (@permission_classes)
    ↓
Serializer Validation (if POST/PUT)
    ↓
Business Logic
    ↓
Database Operation (ORM)
    ↓
Response Serialization
    ↓
HTTP Response
```

### View Decorators Explained

```python
@api_view(['POST'])  # Only allows POST method
@permission_classes([AllowAny])  # No authentication required
def create_process(request):
    # Function body
```

**What happens:**
1. `@api_view(['POST'])` - DRF checks HTTP method, returns 405 if not POST
2. `@permission_classes([AllowAny])` - Skips authentication check
3. `request.data` - Parsed JSON body (DRF feature)
4. `Response()` - Returns JSON response with proper headers

### Serializer Pattern

```python
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', ...)
    
    def validate(self, data):
        # Custom validation
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return data
    
    def create(self, validated_data):
        # Custom creation logic
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user
```

**How it works:**
1. Validates incoming data against model fields
2. Runs custom `validate()` method
3. Calls `create()` or `update()` method
4. Returns serialized data or errors

---

## 💻 Frontend Implementation Details

### Component Lifecycle

```typescript
export class ObjectiveComponent implements OnInit {
  // 1. Constructor runs first
  constructor(private http: HttpClient) {}
  
  // 2. ngOnInit runs after component initialization
  ngOnInit() {
    this.loadProcesses();
    this.loadSubprocesses();
    this.loadObjectives();
  }
  
  // 3. User interactions trigger methods
  saveObjective() {
    // HTTP request
  }
  
  // 4. ngOnDestroy runs when component is destroyed
  // (if OnDestroy is implemented)
}
```

### HTTP Request Flow in Angular

```typescript
// 1. Component calls service method
this.http.post(url, data)
  .subscribe({
    next: (response) => {
      // Success handler
    },
    error: (error) => {
      // Error handler
    }
  });
```

**What happens:**
1. `HttpClient.post()` creates Observable
2. Request is sent asynchronously
3. Response comes back (success or error)
4. `.subscribe()` handles the response
5. Component updates based on response

### Two-Way Data Binding

```html
<!-- Template -->
<input [(ngModel)]="objectiveName" name="objective_name" />
```

**How it works:**
- `[(ngModel)]` is Angular's two-way binding syntax
- User types → `objectiveName` updates
- Code changes `objectiveName` → input updates
- Requires `FormsModule` import

### Component Communication

**Parent → Child:**
```typescript
// Parent component
<app-child [data]="parentData"></app-child>

// Child component
@Input() data: any;
```

**Child → Parent:**
```typescript
// Child component
@Output() eventEmitter = new EventEmitter();
this.eventEmitter.emit(data);

// Parent component
<app-child (eventEmitter)="handleEvent($event)"></app-child>
```

**Service Communication (Shared State):**
```typescript
// Service
private dataSubject = new BehaviorSubject<any>(null);
public data$ = this.dataSubject.asObservable();

// Component A
this.service.dataSubject.next(newData);

// Component B
this.service.data$.subscribe(data => {
  // React to changes
});
```

---

## 📡 API Communication Layer

### HTTP Interceptor Pattern (Recommended)

```typescript
// http.interceptor.ts
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('access_token');
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(req);
  }
}
```

**Benefits:**
- Automatically adds token to all requests
- No need to manually add headers in each component
- Centralized authentication handling

### Error Handling Pattern

```typescript
this.http.get(url).subscribe({
  next: (response) => {
    // Handle success
  },
  error: (error) => {
    if (error.status === 401) {
      // Unauthorized - redirect to login
      this.router.navigate(['/login']);
    } else if (error.status === 404) {
      // Not found
      this.errorMessage = "Resource not found";
    } else {
      // Generic error
      this.errorMessage = "An error occurred";
    }
  }
});
```

---

## 📤 File Upload Mechanism

### Document Upload Flow

#### Frontend (Angular)
```typescript
onDocumentFileSelected(event: any) {
  this.documentFile = event.target.files[0];
}

uploadDocument() {
  const formData = new FormData();
  formData.append('objective_id', this.selectedObjectiveId.toString());
  formData.append('file', this.documentFile);
  formData.append('title', this.documentTitle || this.documentFile.name);
  
  this.http.post(`${this.apiBase}/document/upload/`, formData)
    .subscribe({
      next: () => {
        this.successMessage = "Document uploaded successfully!";
        this.loadDocuments(this.selectedObjectiveId!);
      }
    });
}
```

#### Backend (Django)
```python
@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])  # Required for file uploads
def upload_document(request):
    objective_id = request.data.get("objective_id")
    file = request.FILES.get("file")  # File object
    title = request.data.get("title")
    
    if not (objective_id and file):
        return Response({"error": "Missing required fields"}, status=400)
    
    objective = get_object_or_404(Objective, objective_id=objective_id)
    
    # Create document record
    doc = Document.objects.create(
        objective=objective,
        title=title or file.name,
        file=file  # Django handles file storage
    )
    
    return Response({
        "message": "Document uploaded",
        "document_id": doc.document_id
    }, status=201)
```

#### File Storage
```python
# models.py
file = models.FileField(upload_to="documents/")

# settings.py
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# urls.py
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**File Path:**
- Uploaded file stored at: `media/documents/filename.pdf`
- Accessible via: `http://127.0.0.1:8000/media/documents/filename.pdf`

---

## 👥 Role-Based Access Control

### Backend Role Check

```python
# In views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_only_view(request):
    # Check if user is admin
    try:
        if request.user.extra.role != 'admin':
            return Response({"error": "Admin access required"}, status=403)
    except UserExtra.DoesNotExist:
        return Response({"error": "User profile not found"}, status=404)
    
    # Admin logic here
    return Response({"data": "Admin data"})
```

### Frontend Role Check

```typescript
// auth.service.ts
isAdmin(): boolean {
  return this.getRole() === 'admin';
}

// component.ts
ngOnInit() {
  if (this.authService.isAdmin()) {
    // Show admin features
    this.loadAllUsers();
  } else {
    // Show user features
    this.loadAssignedWork();
  }
}
```

### Sidebar Menu Based on Role

```typescript
// sidebar.component.ts
buildMenu(): void {
  if (this.isAdmin) {
    this.menuItems = [
      { label: 'Home', route: '/dashboard' },
      { label: 'Process Master', route: '/process' },
      { label: 'SubProcess Master', route: '/subprocess' },
      { label: 'Objective Master', route: '/objective' },
      { label: 'Assigned', route: '/assigned' }
    ];
  } else {
    this.menuItems = [
      { label: 'Home', route: '/dashboard' },
      { label: 'Assigned', route: '/assigned' }
    ];
  }
}
```

---

## 🔄 State Management

### LocalStorage State

```typescript
// Stored in localStorage:
- access_token: JWT access token
- refresh_token: JWT refresh token
- user: User object (JSON string)
- role: User role ('admin' or 'user')
```

### Component State

```typescript
export class ObjectiveComponent {
  // Component-level state
  processes: any[] = [];
  subprocesses: any[] = [];
  objectives: any[] = [];
  selectedProcess: number | null = null;
  // ... more state variables
}
```

### Observable State (RxJS)

```typescript
// auth.service.ts
private currentUserSubject = new BehaviorSubject<any>(null);
public currentUser$ = this.currentUserSubject.asObservable();

// Components can subscribe
this.authService.currentUser$.subscribe(user => {
  // React to user changes
});
```

---

## ⚠️ Error Handling Strategy

### Backend Error Handling

```python
@api_view(['GET'])
def get_objective(request, id):
    try:
        objective = Objective.objects.get(objective_id=id)
        return Response({
            "objective_id": objective.objective_id,
            "objective_name": objective.objective_name
        }, status=200)
    except Objective.DoesNotExist:
        return Response({
            "error": "Objective not found"
        }, status=404)
    except Exception as e:
        return Response({
            "error": "An error occurred",
            "details": str(e)
        }, status=500)
```

### Frontend Error Handling

```typescript
this.http.get(url).subscribe({
  next: (response) => {
    this.successMessage = "Operation successful";
    this.errorMessage = ''; // Clear errors
  },
  error: (error) => {
    if (error.error && error.error.error) {
      this.errorMessage = error.error.error;
    } else {
      this.errorMessage = "An unexpected error occurred";
    }
    this.successMessage = ''; // Clear success
    console.error('Error:', error);
  }
});
```

---

## 🔒 Security Implementation

### Password Security

```python
# Django automatically hashes passwords
user = User.objects.create_user(
    username='john',
    password='plaintext'  # Django hashes this
)

# Authentication
user = authenticate(username='john', password='plaintext')
# Django compares hashed password
```

### JWT Token Security

```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
}
```

### CORS Security

```python
# Development
CORS_ALLOW_ALL_ORIGINS = True  # Allows any origin

# Production (should be)
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

### Input Validation

```python
# Serializer validation
class RegisterSerializer(serializers.ModelSerializer):
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
```

---

## 🎯 Key Design Patterns Used

### 1. Repository Pattern (Django ORM)
- Models act as repositories
- Abstracts database operations

### 2. Service Pattern (Angular Services)
- Business logic in services
- Components use services

### 3. Observer Pattern (RxJS Observables)
- Reactive programming
- Component subscriptions

### 4. Decorator Pattern (Django Decorators)
- `@api_view`, `@permission_classes`
- Adds functionality without modifying code

### 5. Singleton Pattern (Angular Services)
- Services are singletons
- `providedIn: 'root'`

---

## 📊 Performance Considerations

### Database Optimization

```python
# Use select_related for ForeignKey
subprocesses = SubProcess.objects.select_related("process").all()
# Single query instead of N+1 queries

# Use prefetch_related for reverse ForeignKey
process = Process.objects.prefetch_related("subprocesses").get(id=1)
```

### Frontend Optimization

```typescript
// Lazy loading (if implemented)
const routes: Routes = [
  {
    path: 'objective',
    loadChildren: () => import('./objective/objective.module').then(m => m.ObjectiveModule)
  }
];
```

### Caching Strategy

```typescript
// Cache API responses
private processesCache: any[] | null = null;

loadProcesses() {
  if (this.processesCache) {
    this.processes = this.processesCache;
    return;
  }
  
  this.http.get(url).subscribe(res => {
    this.processes = res;
    this.processesCache = res;
  });
}
```

---

## 🔍 Debugging Tips

### Backend Debugging

```python
# Add print statements
print(f"Request data: {request.data}")
print(f"User: {request.user}")

# Use Django Debug Toolbar (if installed)
# Check Django logs in terminal
```

### Frontend Debugging

```typescript
// Console logging
console.log('Data:', this.processes);
console.error('Error:', error);

// Browser DevTools
// - Network tab: See all HTTP requests
// - Console tab: See logs and errors
// - Application tab: See localStorage
```

---

## 📝 Summary

This SOP Management System follows a **three-tier architecture**:

1. **Presentation Layer (Angular)**: User interface, forms, routing
2. **Business Logic Layer (Django)**: API endpoints, validation, business rules
3. **Data Layer (MySQL)**: Database storage, relationships

**Key Technologies:**
- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control (Admin/User)
- **Data Flow**: RESTful API with JSON
- **File Handling**: Django FileField with media storage
- **State Management**: LocalStorage + Component state + RxJS Observables

**Communication Flow:**
1. User interacts with Angular UI
2. Angular makes HTTP request to Django API
3. Django processes request, queries database
4. Django returns JSON response
5. Angular updates UI based on response

This architecture ensures **separation of concerns**, **scalability**, and **maintainability**.

---

**End of Technical Documentation**
