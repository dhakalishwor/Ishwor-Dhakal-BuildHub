# Generated manually to add missing address and project_types fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ContractorManagement', '0003_add_user_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='contractor',
            name='address',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='contractor',
            name='project_types',
            field=models.JSONField(blank=True, default=list),
        ),
    ]

