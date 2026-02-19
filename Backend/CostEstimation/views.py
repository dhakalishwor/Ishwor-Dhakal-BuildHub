# CostEstimation/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .permissions import IsClientRole
from .serializers import CostEstimateInputSerializer
from .estimator import estimate_cost

class CostEstimatePreviewView(APIView):
    permission_classes = [IsAuthenticated, IsClientRole]

    def post(self, request):
        s = CostEstimateInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data

        result = estimate_cost(
            category=data["category"],
            area_sqft=data["area_sqft"],
            location=data.get("location", "Other"),
            quality=data.get("quality", "Standard"),
            urgency=data.get("urgency", "Normal"),
            complexity=data.get("complexity", "Medium"),
        )

        return Response(
            {
                "min_cost": result.min_cost,
                "max_cost": result.max_cost,
                "cost_per_sqft": result.cost_per_sqft,
                "confidence": result.confidence,
                "explanation": result.explanation,
            },
            status=status.HTTP_200_OK
        )
