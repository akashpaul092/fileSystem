import math
from typing import List
from django.http import JsonResponse
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response

from core import settings
from .models import File
from .serializers import FileSerializer
from .utils import generate_file_hash
from rest_framework.decorators import action
from django.db.models import Q, OuterRef, Subquery, F
from django.utils.dateparse import parse_date
from django.db.models.functions import Coalesce



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

    @action(detail=False, methods=['post'])
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
        start_size = request.GET.get("startSize","").strip()
        end_size = request.GET.get("endSize","").strip()
        start_date = request.GET.get("startDate","").strip()
        end_date = request.GET.get("endDate","").strip()
        
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('pageSize', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        filters = Q()
        if name:
            filters &= Q(original_filename__icontains=name)

        if type:
            filters &= Q(file_type_coalesced__iexact=type)

        if start_size.isdigit():
            filters &= Q(size_coalesced__gte=int(start_size))

        if end_size.isdigit():
            filters &= Q(size_coalesced__lte=int(end_size))

        if start_date:
            parsed_start = parse_date(start_date)
            if parsed_start:
                filters &= Q(uploaded_at__date__gte=parsed_start)

        if end_date:
            parsed_end = parse_date(end_date)
            if parsed_end:
                filters &= Q(uploaded_at__date__lte=parsed_end)
        
        base_queryset = File.objects.annotate(
            file_coalesced=Coalesce(F('reference__file'), F('file')),
            file_type_coalesced=Coalesce(F('reference__file_type'), F('file_type')),
            file_hash_coalesced=Coalesce(F('reference__file_hash'), F('file_hash')),
            size_coalesced=Coalesce(F('reference__size'), F('size')),
        ).values(
            'id',
            'file_coalesced',
            'original_filename',
            'file_type_coalesced',
            'uploaded_at',
            'file_hash_coalesced',
            'size_coalesced',
            'reference_id'
        ).filter(filters)

        total_count = base_queryset.count()
        total_pages = math.ceil(total_count / page_size)

        queryset = base_queryset[start:end]
        file_objects = [
            File(
                id=file['id'],
                file=file['file_coalesced'],
                original_filename=file['original_filename'],
                file_type=file['file_type_coalesced'],
                file_hash=file['file_hash_coalesced'],
                size=file['size_coalesced'],
                reference_id=file['reference_id'],
                uploaded_at=file['uploaded_at']
            )
            for file in queryset
        ]
        
        serializer = self.get_serializer(file_objects, many=True)
        result_object = {
            "result" : serializer.data,
            'count': total_count,
            'total_pages': total_pages,
            'current_page': page,
            'page_size': page_size,
            'has_next': page < total_pages,
            'has_previous': page > 1,
        }
        return JsonResponse(result_object, safe=False)
    
    @action(detail=False, methods=['get'])
    def get_files(self, request, *args, **kwargs):
        query = request.GET.get("q", "").strip()
        
        if len(query) < 3:
            return JsonResponse([], safe=False)  

        matching_files = File.objects.filter(
            original_filename__icontains=query
        ).order_by("original_filename").values_list("original_filename", flat=True).distinct()[:10]

        return JsonResponse(list(matching_files), safe=False)
    
    @action(detail=False, methods=['get'])
    def get_all_mime_type(self, request, *args, **kwargs):
        file_types = File.objects.filter(file_type__isnull=False).order_by('file_type').values_list('file_type', flat=True).distinct()
        return JsonResponse(list(file_types), safe=False)
