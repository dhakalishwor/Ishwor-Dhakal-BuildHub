from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import ContractorLicense, ClientProfile

User = get_user_model()

class ClientProfileSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source='full_name')
    profilePicture = serializers.ImageField(source='profile_picture', required=False)

    class Meta:
        model = ClientProfile
        fields = ('fullName', 'phone', 'address', 'bio', 'profilePicture')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'first_name', 'last_name')
        
    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        if 'role' in validated_data:
            user.role = validated_data['role']
            user.save()
        return user

class RoleBasedTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        # super().validate handles credential verification (401 if fails)
        data = super().validate(attrs)
        
        user = self.user
        license_status = "N/A"
        
        if user.role == User.ROLE_CONTRACTOR:
            try:
                license_obj = ContractorLicense.objects.get(contractor=user)
                license_status = license_obj.status
            except ContractorLicense.DoesNotExist:
                license_status = "MISSING"

        # The frontend expects a 'user' object with id, username, email, role, and is_admin
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'license_status': license_status,
            'is_admin': user.is_superuser or user.is_staff or user.role == 'admin'
        }
        return data

class ContractorLicenseUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractorLicense
        fields = ('license_document', 'citizenship_document')
        extra_kwargs = {
            'license_document': {'required': True},
            'citizenship_document': {'required': True},
        }


class AdminContractorLicenseSerializer(serializers.ModelSerializer):
    contractorUsername = serializers.CharField(source='contractor.username', read_only=True)
    contractorEmail = serializers.EmailField(source='contractor.email', read_only=True)
    
    class Meta:
        model = ContractorLicense
        fields = '__all__'


class AdminClientSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    profilePicture = serializers.SerializerMethodField()
    dateJoined = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password', 'is_active', 'profilePicture', 'dateJoined')

    def validate_password(self, value):
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def get_profilePicture(self, obj):
        try:
            if hasattr(obj, 'client_profile') and obj.client_profile.profile_picture:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.client_profile.profile_picture.url)
                return obj.client_profile.profile_picture.url
        except Exception:
            pass
        return None

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        validated_data['role'] = 'client'
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance