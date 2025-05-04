from django.http import JsonResponse
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response

from core import settings
from .models import File
from .serializers import FileSerializer
from .utils import generate_file_hash
from rest_framework.decorators import action
from django.db.models import Q
from django.utils.dateparse import parse_date



# Create your views here.

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        file_id = request.data.get('id')

        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not file_id:
            file_hash = generate_file_hash(file_obj)
            data = {
                'file': file_obj,
                'original_filename': file_obj.name,
                'file_type': file_obj.content_type,
                'file_hash': file_hash,
                'size': file_obj.size
            }
        else:
            data = {
                'original_filename': file_obj.name,
                'reference_id': file_id
            }
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def get_duplicate_file(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        hash = generate_file_hash(file_obj)
        file = File.objects.filter(file_hash=hash).first()
        
        if file:
            return Response({'exists': True, 'id': file.id}, status=status.HTTP_200_OK)
        else:
            return Response({'exists': False}, status=status.HTTP_200_OK)
        
    def list(self, request, *args, **kwargs):
        name = request.GET.get("name","").strip()
        type = request.GET.get("type","").strip()
        startSize = request.GET.get("startSize","").strip()
        endSize = request.GET.get("endSize","").strip()
        startDate = request.GET.get("startDate","").strip()
        endDate = request.GET.get("endDate","").strip()
        filters = Q()

        if name:
            filters &= Q(original_filename__icontains=name)

        if type:
            filters &= Q(file_type__iexact=type)

        if startSize.isdigit():
            filters &= Q(size__gte=int(startSize))

        if endSize.isdigit():
            filters &= Q(size__lte=int(endSize))

        if startDate:
            parsed_start = parse_date(startDate)
            if parsed_start:
                filters &= Q(uploaded_at__date__gte=parsed_start)

        if endDate:
            parsed_end = parse_date(endDate)
            if parsed_end:
                filters &= Q(uploaded_at__date__lte=parsed_end)
        
        files = list(File.objects.filter(filters).values('id', 'file', 'original_filename', 'file_type', 'file_hash', 'size', 'reference_id'))
        final_files = []
        base_url = request.scheme + '://' +request.get_host() + settings.MEDIA_URL
        for file in files:
            if file['reference_id'] is None:
                file['file'] = base_url + file['file']
                final_files.append(file)
            else:
                original = next((obj for obj in files if obj['id'] == file['reference_id']), None)
                if original:
                    original_file_url = base_url + original['file'] if original['file'] else None
                    merged = {
                        'id': file['id'],
                        'file': original_file_url,
                        'original_filename': file['original_filename'],
                        'file_type': original['file_type'],
                        'file_hash': original['file_hash'],
                        'size': original['size'],
                        'reference_id': file['reference_id']
                    }
                    final_files.append(merged)
       
        serializer = self.get_serializer(final_files, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def get_files(self, request, *args, **kwargs):
        query = request.GET.get("q", "").strip()
        
        if len(query) < 3:
            return JsonResponse([], safe=False)  

        matching_files = File.objects.filter(
            original_filename__icontains=query
        ).order_by("original_filename").values_list("original_filename", flat=True).distinct()[:10]

        return JsonResponse(list(matching_files), safe=False)