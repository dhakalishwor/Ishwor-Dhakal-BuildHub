# CostEstimation/serializers.py
from rest_framework import serializers

class CostEstimateInputSerializer(serializers.Serializer):
    category = serializers.CharField()
    area_sqft = serializers.FloatField(min_value=50)
    location = serializers.CharField(required=False, allow_blank=True)
    quality = serializers.ChoiceField(choices=["Basic", "Standard", "Premium"], default="Standard")
    urgency = serializers.ChoiceField(choices=["Normal", "Urgent"], default="Normal")
    complexity = serializers.ChoiceField(choices=["Low", "Medium", "High"], default="Medium")


class CostEstimateOutputSerializer(serializers.Serializer):
    min_cost = serializers.FloatField()
    max_cost = serializers.FloatField()
    cost_per_sqft = serializers.FloatField()
    confidence = serializers.CharField()
    explanation = serializers.ListField(child=serializers.CharField())
