from django.db import models
import uuid
import os

def file_upload_path(instance, filename):
    """Generate file path for new file upload"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('uploads', filename)

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=file_upload_path, null=True)
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100, null=True)
    file_hash = models.CharField(max_length=64, unique=True, null=True, blank=True)
    size = models.BigIntegerField(null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reference_id = models.UUIDField(unique=False, null=True, blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return self.original_filename
