import os
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from .utils import verify_contractor_documents


class ContractorVerificationAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("--- Start Document Verification ---")
        citizenship = request.FILES.get("citizenship")
        contractor_license = request.FILES.get("contractor_license")

        if not citizenship or not contractor_license:
            return Response(
                {"error": "Both documents are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

        file_paths = []

        for file in [citizenship, contractor_license]:
            file_path = os.path.join(settings.MEDIA_ROOT, file.name)

            with open(file_path, "wb+") as f:
                for chunk in file.chunks():
                    f.write(chunk)

            file_paths.append(file_path)

        result = verify_contractor_documents(file_paths)

        if result.get("verified"):
            return Response(
                {
                    "message": result.get("message"),
                    "redirect": "/login",  # Explicit redirect instruction
                    "details": result
                },
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {
                    "error": result.get("message"),
                    "details": result
                },
                status=status.HTTP_400_BAD_REQUEST
            )