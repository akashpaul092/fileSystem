# Generated by Django 4.2.1 on 2025-05-04 08:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('files', '0002_file_file_hash'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='reference_id',
            field=models.UUIDField(blank=True, null=True),
        ),
    ]
