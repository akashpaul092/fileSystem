from rest_framework import serializers
from .models import File

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'file', 'original_filename', 'file_type', 'file_hash', 'size', 'uploaded_at','reference_id']
        read_only_fields = ['id', 'uploaded_at'] 
    file = serializers.CharField() 