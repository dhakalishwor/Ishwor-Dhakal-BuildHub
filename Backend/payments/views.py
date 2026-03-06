import base64
import json
import uuid
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from RecommendationSystem.models import Project
from BiddingSystem.models import Bid
from .models import Payment
from .utils import esewa_generate_signature
from NotificationSystem.utils import notify

def _get_esewa_settings():
    product_code = getattr(settings, "ESEWA_PRODUCT_CODE", "")
    secret_key = getattr(settings, "ESEWA_SECRET_KEY", "")
    form_url = getattr(
        settings,
        "ESEWA_FORM_URL",
        "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    )

    if not product_code:
        raise ValueError("ESEWA_PRODUCT_CODE not set")
    if not secret_key:
        raise ValueError("ESEWA_SECRET_KEY not set")

    return product_code, secret_key, form_url

class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)

        if project.client_id != request.user.id:
            return Response({"detail": "Not allowed"}, status=403)

        if project.status != "COMPLETED":
            return Response({"detail": "Project must be completed before payment"}, status=400)

        if project.payment_status == "PAID":
            return Response({"detail": "Project already paid"}, status=400)

        accepted_bid = Bid.objects.filter(project=project, status="ACCEPTED").first()
        if not accepted_bid:
            return Response({"detail": "No accepted bid found"}, status=400)

        amount = int(accepted_bid.proposed_price)
        product_code, secret_key, form_url = _get_esewa_settings()

        transaction_uuid = f"BH-{project.id}-{uuid.uuid4().hex[:10]}"

        payment, _ = Payment.objects.update_or_create(
            project=project,
            defaults={
                "client": request.user,
                "amount": amount,
                "transaction_uuid": transaction_uuid,
                "status": "INITIATED",
            },
        )

        # Notify client that payment process has started
        notify(
            user=request.user,
            title="Payment Initiated",
            message=f"You started a payment of Rs {amount} for project \"{project.title}\". Complete the process on eSewa.",
            type="PAYMENT",
            link=f"/client/projects?project={project.id}",
        )

        tax_amount = 0
        service_charge = 0
        delivery_charge = 0
        total_amount = amount + tax_amount + service_charge + delivery_charge

        signed_field_names = "total_amount,transaction_uuid,product_code"
        message = (
            f"total_amount={total_amount},"
            f"transaction_uuid={transaction_uuid},"
            f"product_code={product_code}"
        )
        signature = esewa_generate_signature(secret_key, message)

        return Response(
            {
                "esewa_form_url": form_url,
                "payload": {
                    "amount": str(amount),
                    "tax_amount": str(tax_amount),
                    "total_amount": str(total_amount),
                    "transaction_uuid": transaction_uuid,
                    "product_code": product_code,
                    "product_service_charge": str(service_charge),
                    "product_delivery_charge": str(delivery_charge),
                    "success_url": settings.ESEWA_SUCCESS_URL,
                    "failure_url": settings.ESEWA_FAILURE_URL,
                    "signed_field_names": signed_field_names,
                    "signature": signature,
                },
            },
            status=200,
        )

class PaymentVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data_b64 = request.data.get("data")
        if not data_b64:
            return Response({"detail": "Missing data"}, status=400)

        try:
            decoded = base64.b64decode(data_b64).decode("utf-8")
            payload = json.loads(decoded)
        except Exception:
            return Response({"detail": "Invalid data payload"}, status=400)

        required = [
            "transaction_uuid",
            "status",
            "total_amount",
            "product_code",
            "signed_field_names",
            "signature",
        ]
        for k in required:
            if k not in payload:
                return Response({"detail": f"Missing {k}"}, status=400)

        product_code, secret_key, _ = _get_esewa_settings()

        if payload["product_code"] != product_code:
            return Response({"detail": "Invalid product code"}, status=400)

        signed_fields = payload["signed_field_names"].split(",")
        message = ",".join([f"{f}={payload[f]}" for f in signed_fields])
        expected_signature = esewa_generate_signature(secret_key, message)

        if expected_signature != payload["signature"]:
            return Response({"detail": "Signature verification failed"}, status=400)

        payment = get_object_or_404(Payment, transaction_uuid=payload["transaction_uuid"])
        project = payment.project

        if payload["status"].upper() != "COMPLETE":
            payment.status = "FAILED"
            payment.save()

            # Notify client about payment failure
            notify(
                user=payment.client,
                title="Payment Failed",
                message=f"Your payment for project \"{project.title}\" could not be completed. Please try again.",
                type="PAYMENT",
                link=f"/clientdashboard?menu=my-projects&project={project.id}",
            )
            return Response({"detail": "Payment not completed"}, status=400)

        payment.status = "COMPLETE"
        payment.transaction_code = payload.get("transaction_code", "")
        payment.save()

        project.payment_status = "PAID"
        project.payment_method = "ESEWA"
        project.paid_at = now()
        project.final_amount = payment.amount
        project.save()

        # Notify client — payment confirmed
        notify(
            user=payment.client,
            title="Payment Successful ✅",
            message=f"Your payment of Rs {payment.amount} for project \"{project.title}\" was successful.",
            type="PAYMENT",
            link=f"/client/projects?project={project.id}",
        )

        # Notify assigned contractor — payment received
        if project.assigned_contractor:
            notify(
                user=project.assigned_contractor,
                title="Payment Received",
                message=f"The client has paid Rs {payment.amount} for project \"{project.title}\".",
                type="PAYMENT",
                link=f"/contractor?menu=bids&project={project.id}",
            )

        return Response({"detail": "Payment verified successfully"}, status=200)

class WorkerPaymentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return payments for projects where the user is the assigned contractor
        payments = Payment.objects.filter(project__assigned_contractor=request.user).order_by("-created_at")
        
        # We can simplify the response or use a serializer
        data = []
        for p in payments:
            data.append({
                "id": p.id,
                "project_title": p.project.title,
                "amount": p.amount,
                "status": p.status,
                "date": p.created_at.strftime("%Y-%m-%d"),
            })
        return Response(data)

class PaymentFailureView(APIView):
    permission_classes = [AllowAny]

    def _handle_cancel(self, request):
        # Try to notify the client if we can identify the transaction
        transaction_uuid = request.query_params.get("oid") or request.data.get("transaction_uuid")
        if transaction_uuid:
            payment = Payment.objects.filter(transaction_uuid=transaction_uuid).first()
            if payment and payment.status == "INITIATED":
                payment.status = "CANCELLED"
                payment.save(update_fields=["status"])
                notify(
                    user=payment.client,
                    title="Payment Cancelled",
                    message=f"Your payment for project \"{payment.project.title}\" was cancelled.",
                    type="PAYMENT",
                    link=f"/clientdashboard?menu=my-projects&project={payment.project.id}",
                )
        return Response({"detail": "Payment cancelled"}, status=200)

    def get(self, request):
        return self._handle_cancel(request)

    def post(self, request):
        return self._handle_cancel(request)
