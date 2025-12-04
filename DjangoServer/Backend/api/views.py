from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer
from django.contrib.auth.models import User
from api.models import UserExtra


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
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