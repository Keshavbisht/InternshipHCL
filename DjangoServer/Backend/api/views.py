from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer
from django.contrib.auth.models import User
from api.models import UserExtra

from api.models import Process

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


# ✅ NEW FUNCTION — Return User + UserExtra merged
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
            "role": extra.role if extra else "user"
        })

    return Response(data)
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
        status=status
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
            "created_at": s.created_at
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

    sub.subprocess_name = request.data.get("subprocess_name", sub.subprocess_name)
    sub.status = request.data.get("status", sub.status)

    # Optional: change process
    new_process_id = request.data.get("process_id")
    if new_process_id:
        try:
            new_process = Process.objects.get(process_id=new_process_id)
            sub.process = new_process
        except Process.DoesNotExist:
            return Response({"error": "Invalid new process_id"}, status=404)

    sub.save()

    return Response({"message": "SubProcess updated successfully"}, status=200)
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
@permission_classes([AllowAny])
def get_user_assignments(request, user_id):
    """Get processes and subprocesses assigned to a specific user"""
    try:
        user = User.objects.get(id=user_id)
        extra = UserExtra.objects.filter(user=user).first()
        
        if not extra:
            return Response({
                "assigned_processes": [],
                "assigned_subprocesses": []
            }, status=200)
        
        # Get full process and subprocess details
        assigned_process_ids = extra.assigned_processes or []
        assigned_subprocess_ids = extra.assigned_subprocesses or []
        
        processes = Process.objects.filter(process_id__in=assigned_process_ids)
        subprocesses = SubProcess.objects.filter(subprocess_id__in=assigned_subprocess_ids)
        
        process_data = [{"process_id": p.process_id, "process_name": p.process_name} for p in processes]
        subprocess_data = [{"subprocess_id": s.subprocess_id, "subprocess_name": s.subprocess_name} for s in subprocesses]
        
        return Response({
            "assigned_processes": process_data,
            "assigned_subprocesses": subprocess_data
        }, status=200)
        
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


# ASSIGN PROCESSES TO USER (Admin only)
@api_view(['POST'])
@permission_classes([AllowAny])  # Change to IsAuthenticated + Admin check in production
def assign_processes_to_user(request, user_id):
    """Admin assigns processes and subprocesses to a user"""
    try:
        user = User.objects.get(id=user_id)
        extra, created = UserExtra.objects.get_or_create(user=user)
        
        # Get arrays of IDs from request
        process_ids = request.data.get("process_ids", [])
        subprocess_ids = request.data.get("subprocess_ids", [])
        
        # Validate that processes exist
        valid_processes = Process.objects.filter(process_id__in=process_ids).values_list('process_id', flat=True)
        valid_subprocesses = SubProcess.objects.filter(subprocess_id__in=subprocess_ids).values_list('subprocess_id', flat=True)
        
        # Save assignments
        extra.assigned_processes = list(valid_processes)
        extra.assigned_subprocesses = list(valid_subprocesses)
        extra.save()
        
        return Response({
            "message": "Processes assigned successfully",
            "assigned_processes": extra.assigned_processes,
            "assigned_subprocesses": extra.assigned_subprocesses
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
            # 👇 NEW: Include assigned processes
            "assigned_processes": extra.assigned_processes if extra else [],
            "assigned_subprocesses": extra.assigned_subprocesses if extra else []
        })

    return Response(data)