from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer
from django.contrib.auth.models import User
from api.models import UserExtra

# from api.models import Process

from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from django.shortcuts import get_object_or_404

from api.models import Process, SubProcess, Objective, Document, Video, Image


#-------------------------***********-----------------------
# Login code before adding role - 4 dec - 9 am

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def login_view(request):
#     serializer = LoginSerializer(data=request.data)
    
#     if serializer.is_valid():
#         user = serializer.validated_data['user']
#         refresh = RefreshToken.for_user(user)
        
#         return Response({
#             'user': UserSerializer(user).data,
#             "role": role,
#             'tokens': {
#                 'refresh': str(refresh),
#                 'access': str(refresh.access_token),
#             }
#         }, status=status.HTTP_200_OK)
    
#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        # ✅ Fetch role from UserExtra
        try:
            role = user.extra.role  # thanks to related_name="extra"
        except UserExtra.DoesNotExist:
            role = "user"

        return Response({
            'user': UserSerializer(user).data,
            'role': role,  # 👈 IMPORTANT
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()

        # Create UserExtra record
        phone = request.data.get("phone")
        UserExtra.objects.create(
            user=user,
            phone=phone,
            status="active"
        )

        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([AllowAny])  # Change to IsAuthenticated in production
def delete_user(request, id):
    """Delete a specific user"""
    try:
        user = User.objects.get(id=id)
        
        # Delete associated UserExtra first (if exists)
        UserExtra.objects.filter(user=user).delete()
        
        # Delete the user
        user.delete()
        
        return Response({
            'message': 'User deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)


# @api_view(['PUT'])
# @permission_classes([AllowAny])
# def update_user(request, id):
#     """Update a specific user"""
#     try:
#         user = User.objects.get(id=id)
        
#         # Update user fields
#         user.first_name = request.data.get('first_name', user.first_name)
#         user.last_name = request.data.get('last_name', user.last_name)
#         user.username = request.data.get('username', user.username)
#         user.email = request.data.get('email', user.email)
        
#         # Update password if provided
#         password = request.data.get('password')
#         if password:
#             user.set_password(password)
        
#         user.save()
        
#         # Update UserExtra
#         phone = request.data.get('phone')
#         if phone:
#             extra, created = UserExtra.objects.get_or_create(user=user)
#             extra.phone = phone
#             extra.save()
        
#         return Response({
#             'message': 'User updated successfully',
#             'user': UserSerializer(user).data
#         }, status=status.HTTP_200_OK)
        
#     except User.DoesNotExist:
#         return Response({
#             'error': 'User not found'
#         }, status=status.HTTP_404_NOT_FOUND)
@api_view(['PUT'])
@permission_classes([AllowAny])
def update_user(request, id):
    """Update a specific user"""
    try:
        user = User.objects.get(id=id)
        
        # Check if username is being changed and if it already exists
        new_username = request.data.get('username')
        if new_username and new_username != user.username:
            if User.objects.filter(username=new_username).exists():
                return Response({
                    'error': 'Username already exists'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email is being changed and if it already exists
        new_email = request.data.get('email')
        if new_email and new_email != user.email:
            if User.objects.filter(email=new_email).exists():
                return Response({
                    'error': 'Email already exists'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update user fields
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.username = new_username if new_username else user.username
        user.email = new_email if new_email else user.email
        
        # Update password if provided
        password = request.data.get('password')
        if password:
            user.set_password(password)
        
        user.save()
        
        # Update UserExtra
        phone = request.data.get('phone')
        if phone:
            extra, created = UserExtra.objects.get_or_create(user=user)
            extra.phone = phone
            extra.save()
        
        return Response({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': extra.phone if extra else None
            }
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
        
@api_view(['PATCH'])
@permission_classes([AllowAny])
def toggle_status(request, id):
    """Toggle user status between active and inactive"""
    try:
        user = User.objects.get(id=id)
        extra, created = UserExtra.objects.get_or_create(user=user)
        
        # Get new status from request
        new_status = request.data.get('status')
        
        if new_status not in ['active', 'inactive']:
            return Response({
                'error': 'Invalid status. Must be "active" or "inactive"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        extra.status = new_status
        extra.save()
        
        return Response({
            'message': f'User status updated to {new_status}',
            'status': new_status
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
        
        #update role by admin
@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_role(request, id):
    """Admin changes user's role"""
    try:
        user = User.objects.get(id=id)
        
        # IMPORTANT FIX
        extra, created = UserExtra.objects.get_or_create(user=user)

        new_role = request.data.get("role")

        if new_role not in ["admin", "user"]:
            return Response({"error": "Invalid role"}, status=400)

        extra.role = new_role
        extra.save()

        return Response({
            "message": "Role updated successfully",
            "role": new_role
        }, status=200)

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    


#PROCESS VIEW TO CREATE PROCESS
@api_view(['POST'])
@permission_classes([AllowAny])
def create_process(request):
    process_name = request.data.get("process_name")
    status = request.data.get("status", "active")

    if not process_name:
        return Response({"error": "Process name is required"}, status=400)

    if Process.objects.filter(process_name=process_name).exists():
        return Response({"error": "Process already exists"}, status=400)

    process = Process.objects.create(
        process_name=process_name,
        status=status
    )

    return Response({
        "message": "Process created successfully",
        "process": {
            "process_id": process.process_id,
            "process_name": process.process_name,
            "status": process.status
        }
    }, status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def list_processes(request):
    processes = Process.objects.all().order_by('-created_at')

    data = []
    for p in processes:
        data.append({
            "process_id": p.process_id,
            "process_name": p.process_name,
            "status": p.status,
            "created_at": p.created_at,
            "updated_at": p.updated_at
        })

    return Response(data, status=200)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_process(request, id):
    try:
        process = Process.objects.get(process_id=id)
    except Process.DoesNotExist:
        return Response({"error": "Process not found"}, status=404)

    process.process_name = request.data.get("process_name", process.process_name)
    process.status = request.data.get("status", process.status)
    process.save()

    return Response({
        "message": "Process updated successfully",
        "process": {
            "process_id": process.process_id,
            "process_name": process.process_name,
            "status": process.status
        }
    }, status=200)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_process(request, id):
    try:
        process = Process.objects.get(process_id=id)
    except Process.DoesNotExist:
        return Response({"error": "Process not found"}, status=404)

    process.delete()
    return Response({"message": "Process deleted successfully"}, status=200)

from api.models import SubProcess, Process

# CREATE SUBPROCESS VIEW
@api_view(['POST'])
@permission_classes([AllowAny])
def create_subprocess(request):
    process_id = request.data.get("process_id")
    subprocess_name = request.data.get("subprocess_name")
    status = request.data.get("status", "active")
    link = request.data.get("link")

    if not process_id:
        return Response({"error": "process_id is required"}, status=400)

    if not subprocess_name:
        return Response({"error": "subprocess_name is required"}, status=400)

    try:
        process = Process.objects.get(process_id=process_id)
    except Process.DoesNotExist:
        return Response({"error": "Invalid process_id"}, status=404)

    sub = SubProcess.objects.create(
        process=process,
        subprocess_name=subprocess_name,
        status=status,
        link=link
    )

    return Response({
        "message": "Subprocess created successfully",
        "subprocess": {
            "subprocess_id": sub.subprocess_id,
            "process_id": process_id,
            "subprocess_name": sub.subprocess_name,
            "status": sub.status
        }
    }, status=201)
# LIST SUBPROCESSES VIEW
@api_view(['GET'])
@permission_classes([AllowAny])
def list_subprocesses(request):
    subprocesses = SubProcess.objects.select_related("process").all().order_by("-created_at")

    data = []
    for s in subprocesses:
        data.append({
            "subprocess_id": s.subprocess_id,
            "subprocess_name": s.subprocess_name,
            "status": s.status,
            "process_id": s.process.process_id,
            "process_name": s.process.process_name,
            "created_at": s.created_at,
            "link": s.link
        })

    return Response(data, status=200)
# UPDATE SUBPROCESS VIEW
@api_view(['PUT'])
@permission_classes([AllowAny])
def update_subprocess(request, id):
    try:
        sub = SubProcess.objects.get(subprocess_id=id)
    except SubProcess.DoesNotExist:
        return Response({"error": "SubProcess not found"}, status=404)

    # Update name & status
    sub.subprocess_name = request.data.get("subprocess_name", sub.subprocess_name)
    sub.status = request.data.get("status", sub.status)

    # 🔥 NEW: Update link
    if "link" in request.data:
        sub.link = request.data.get("link")

    # Change parent process (optional)
    new_process_id = request.data.get("process_id")
    if new_process_id:
        try:
            new_process = Process.objects.get(process_id=new_process_id)
            sub.process = new_process
        except Process.DoesNotExist:
            return Response({"error": "Invalid new process_id"}, status=404)

    sub.save()

    return Response({
        "message": "SubProcess updated successfully",
        "subprocess": {
            "subprocess_id": sub.subprocess_id,
            "process_id": sub.process.process_id,
            "subprocess_name": sub.subprocess_name,
            "status": sub.status,
            "link": sub.link
        }
    }, status=200)

# DELETE SUBPROCESS VIEW
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_subprocess(request, id):
    try:
        sub = SubProcess.objects.get(subprocess_id=id)
    except SubProcess.DoesNotExist:
        return Response({"error": "SubProcess not found"}, status=404)

    sub.delete()

    return Response({"message": "SubProcess deleted successfully"}, status=200)

# GET USER ASSIGNMENTS
@api_view(['GET'])
def get_user_assignments(request, user_id):
    try:
        user_extra = UserExtra.objects.get(user_id=user_id)
    except UserExtra.DoesNotExist:
        return Response({"data": []})

    process_ids = user_extra.assigned_processes or []
    subprocess_ids = user_extra.assigned_subprocesses or []
    objective_ids = user_extra.assigned_objectives or []

    output = []

    for pid in process_ids:

        process = Process.objects.filter(process_id=pid).first()
        if not process:
            continue

        subprocesses = SubProcess.objects.filter(
            process_id=pid,
            subprocess_id__in=subprocess_ids
        )

        objective_list = []

        for sp in subprocesses:

            objectives = Objective.objects.filter(
                subprocess_id=sp.subprocess_id,
                objective_id__in=objective_ids
            )

            for obj in objectives:

                # ----- COLLECT ALL DOCUMENT LINKS -----
                document_links = [
                    request.build_absolute_uri(doc.file.url)
                    for doc in obj.documents.all()
                ]

                # ----- COLLECT ALL VIDEO LINKS -----
                video_links = [video.video_url for video in obj.videos.all()]

                # ----- COLLECT ALL IMAGE LINKS -----
                image_links = [
                    request.build_absolute_uri(img.image.url)
                    for img in obj.images.all()
                ]

                # ----- COMBINE THEM -----
                all_links = {
                    "documents": document_links,
                    "videos": video_links,
                    "images": image_links
                }

                objective_list.append({
                    "objective_name": obj.objective_name,
                    "subprocess_name": sp.subprocess_name,
                    "links": all_links
                })

        output.append({
            "process_name": process.process_name,
            "objectives": objective_list
        })

    return Response({"data": output})




# ASSIGN PROCESSES TO USER (Admin only)
@api_view(['POST'])
@permission_classes([AllowAny])  # Change to IsAuthenticated + Admin check in production
def assign_processes_to_user(request, user_id):
    """Admin assigns processes, subprocesses, and objectives to a user"""
    try:
        user = User.objects.get(id=user_id)
        extra, created = UserExtra.objects.get_or_create(user=user)
        
        # Get arrays of IDs from request
        process_ids = request.data.get("process_ids", [])
        subprocess_ids = request.data.get("subprocess_ids", [])
        objective_ids = request.data.get("objective_ids", [])
        
        # Validate that processes, subprocesses, and objectives exist
        valid_processes = Process.objects.filter(process_id__in=process_ids).values_list('process_id', flat=True)
        valid_subprocesses = SubProcess.objects.filter(subprocess_id__in=subprocess_ids).values_list('subprocess_id', flat=True)
        valid_objectives = Objective.objects.filter(objective_id__in=objective_ids).values_list('objective_id', flat=True)
        
        # Save assignments
        extra.assigned_processes = list(valid_processes)
        extra.assigned_subprocesses = list(valid_subprocesses)
        extra.assigned_objectives = list(valid_objectives)
        extra.save()
        
        return Response({
            "message": "Assignments saved successfully",
            "assigned_processes": extra.assigned_processes,
            "assigned_subprocesses": extra.assigned_subprocesses,
            "assigned_objectives": extra.assigned_objectives
        }, status=200)
        
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


# UPDATE LIST_USERS to include assignments
# REPLACE your existing list_users function with this:
@api_view(['GET'])
@permission_classes([AllowAny])
def list_users(request):
    users = User.objects.all()
    data = []

    for user in users:
        extra = UserExtra.objects.filter(user=user).first()

        data.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": extra.phone if extra else None,
            "status": extra.status if extra else None,
            "role": extra.role if extra else "user",
            # 👇 NEW: Include assigned processes, subprocesses, and objectives
            "assigned_processes": extra.assigned_processes if extra else [],
            "assigned_subprocesses": extra.assigned_subprocesses if extra else [],
            "assigned_objectives": extra.assigned_objectives if extra else []
        })

    return Response(data)

# ---------------------------------OBJECTIVE CRUD---------------------------------------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def create_objective(request):
    process_id = request.data.get("process_id")
    subprocess_id = request.data.get("subprocess_id")
    objective_name = request.data.get("objective_name")
    status = request.data.get("status", "active")

    if not (process_id and subprocess_id and objective_name):
        return Response({"error": "process_id, subprocess_id and objective_name are required"}, status=400)

    process = get_object_or_404(Process, process_id=process_id)
    subprocess = get_object_or_404(SubProcess, subprocess_id=subprocess_id)

    obj = Objective.objects.create(
        process=process,
        subprocess=subprocess,
        objective_name=objective_name,
        status=status
    )

    return Response({
        "message": "Objective created successfully",
        "objective": {
            "id": obj.objective_id,
            "name": obj.objective_name
        }
    }, status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def list_objectives(request):
    objectives = Objective.objects.all().order_by('-created_at')

    data = []
    for obj in objectives:
        data.append({
            "objective_id": obj.objective_id,
            "objective_name": obj.objective_name,
            "process_id": obj.process.process_id,
            "process_name": obj.process.process_name,
            "subprocess_id": obj.subprocess.subprocess_id,
            "subprocess_name": obj.subprocess.subprocess_name,
            "status": obj.status,

            # Correct media count fields
            "document_count": obj.documents.count(),
            "video_count": obj.videos.count(),
            "image_count": obj.images.count(),
        })

    return Response({"data": data}, status=200)

#UPDATE OBJECTIVE VIEW
@api_view(['PUT'])
@permission_classes([AllowAny])
def update_objective(request, id):
    obj = get_object_or_404(Objective, objective_id=id)

    obj.objective_name = request.data.get("objective_name", obj.objective_name)
    obj.status = request.data.get("status", obj.status)

    # Optional: update process/subprocess
    new_process = request.data.get("process_id")
    new_sub = request.data.get("subprocess_id")

    if new_process:
        obj.process = get_object_or_404(Process, process_id=new_process)
    if new_sub:
        obj.subprocess = get_object_or_404(SubProcess, subprocess_id=new_sub)

    obj.save()

    return Response({"message": "Objective updated successfully"}, status=200)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_objective(request, id):
    obj = get_object_or_404(Objective, objective_id=id)
    obj.delete()
    return Response({"message": "Objective deleted successfully"}, status=200)

# ---------------------------------DOCUMENT CRUD---------------------------------------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def upload_document(request):
    objective_id = request.data.get("objective_id")
    file = request.FILES.get("file")
    title = request.data.get("title")

    if not (objective_id and file):
        return Response({"error": "objective_id and file are required"}, status=400)

    objective = get_object_or_404(Objective, objective_id=objective_id)

    doc = Document.objects.create(
        objective=objective,
        title=title or file.name,
        file=file
    )

    return Response({
        "message": "Document uploaded",
        "document_id": doc.document_id
    }, status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def list_documents(request, objective_id):
    documents = Document.objects.filter(objective_id=objective_id)

    data = [{
        "document_id": d.document_id,
        "title": d.title,
        "file_url": d.file.url
    } for d in documents]

    return Response({"documents": data}, status=200)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_document(request, id):
    doc = get_object_or_404(Document, document_id=id)
    doc.delete()
    return Response({"message": "Document deleted"}, status=200)


# ---------------------------------VIDEO CRUD---------------------------------------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def create_video(request):
    objective_id = request.data.get("objective_id")
    title = request.data.get("title")
    video_url = request.data.get("video_url")

    if not (objective_id and video_url):
        return Response({"error": "objective_id and video_url are required"}, status=400)

    objective = get_object_or_404(Objective, objective_id=objective_id)

    video = Video.objects.create(
        objective=objective,
        title=title or "Untitled Video",
        video_url=video_url
    )

    return Response({"message": "Video added", "id": video.video_id}, status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def list_videos(request, objective_id):
    videos = Video.objects.filter(objective_id=objective_id)

    data = [{
        "video_id": v.video_id,
        "title": v.title,
        "video_url": v.video_url
    } for v in videos]

    return Response({"videos": data}, status=200)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_video(request, id):
    video = get_object_or_404(Video, video_id=id)
    video.delete()
    return Response({"message": "Video deleted"}, status=200)


# ---------------------------------IMAGE CRUD---------------------------------------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def upload_image(request):
    objective_id = request.data.get("objective_id")
    image_file = request.FILES.get("image")
    title = request.data.get("title")

    if not (objective_id and image_file):
        return Response({"error": "objective_id and image are required"}, status=400)

    objective = get_object_or_404(Objective, objective_id=objective_id)

    img = Image.objects.create(
        objective=objective,
        title=title or image_file.name,
        image=image_file
    )

    return Response({
        "message": "Image uploaded successfully",
        "image_id": img.image_id,
        "image_url": img.image.url if img.image else None
    }, status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def list_images(request, objective_id):
    images = Image.objects.filter(objective_id=objective_id)

    data = [{
        "image_id": img.image_id,
        "title": img.title,
        "image_url": img.image.url if img.image else None
    } for img in images]

    return Response({"images": data}, status=200)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_image(request, id):
    img = get_object_or_404(Image, image_id=id)
    img.delete()
    return Response({"message": "Image deleted successfully"}, status=200)
