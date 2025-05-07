from rest_framework import serializers
from .models import File

class FileSerializer(serializers.ModelSerializer):
    reference = serializers.PrimaryKeyRelatedField(queryset=File.objects.all(), allow_null=True, required=False)

    class Meta:
        model = File
        fields = ['id', 'file', 'original_filename', 'file_type', 'file_hash', 'size', 'uploaded_at', 'reference']
        read_only_fields = ['id', 'uploaded_at']
