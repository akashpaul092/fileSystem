# Generated by Django 4.2.1 on 2025-05-04 08:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('files', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='file_hash',
            field=models.CharField(blank=True, max_length=64, null=True, unique=True),
        ),
    ]
