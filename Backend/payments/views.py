import base64
import json
import uuid
from django.db import models
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from RecommendationSystem.models import Project
from BiddingSystem.models import Bid
from ProgressTracking.models import WorkLog, ProjectAssignment
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
        payment_type = request.data.get("payment_type", "FINAL")
        milestone_id = request.data.get("milestone_id")

        if project.client_id != request.user.id:
            return Response({"detail": "Not allowed"}, status=403)

        # Basic validations based on payment type
        if payment_type == "ADVANCE":
            if project.advance_paid:
                return Response({"detail": "Advance already paid"}, status=400)
            if project.status != "ACTIVE":
                return Response({"detail": "Project must be ACTIVE to pay advance"}, status=400)
        
        elif payment_type == "MILESTONE":
            if not milestone_id:
                return Response({"detail": "milestone_id is required for MILESTONE payment"}, status=400)
            from ProgressTracking.models import Milestone
            milestone = get_object_or_404(Milestone, id=milestone_id, project=project)
            if milestone.status == "PAID":
                return Response({"detail": "Milestone already paid"}, status=400)
            if milestone.status != "COMPLETED":
                # Final payment is also a milestone in my auto-gen, but let's check title or just allow if COMPLETED
                return Response({"detail": "Milestone must be marked as COMPLETED by client approval before payment"}, status=400)
        
        elif payment_type == "FINAL":
            if project.payment_status == "PAID":
                return Response({"detail": "Project already fully paid"}, status=400)
            if not project.work_completed and project.status != "COMPLETED":
                 from ProgressTracking.models import Milestone
                 final_m = Milestone.objects.filter(project=project, title__icontains="Final").first()
                 if not (final_m and final_m.status == "COMPLETED"):
                    return Response({"detail": "Project work must be completed before final payment"}, status=400)

        elif payment_type == "REMAINING":
            if project.payment_status == "PAID":
                return Response({"detail": "Project already fully paid"}, status=400)
            if project.status != "COMPLETED":
                return Response({"detail": "Remaining payment is only available for completed projects"}, status=400)

        # Get Amount
        if payment_type == "MILESTONE":
            from ProgressTracking.models import Milestone
            milestone = Milestone.objects.get(id=milestone_id)
            amount = int(milestone.amount)
        elif payment_type == "ADVANCE":
            from ProgressTracking.models import Milestone
            adv_m = Milestone.objects.filter(project=project, title__icontains="Advance").first()
            if adv_m:
                amount = int(adv_m.amount)
            else:
                accepted_bid = Bid.objects.filter(project=project, status="ACCEPTED").first()
                amount = int(accepted_bid.proposed_price * 20 / 100) if accepted_bid else 0
        elif payment_type == "REMAINING":
            accepted_bid = Bid.objects.filter(project=project, status="ACCEPTED").first()
            total_price = int(accepted_bid.proposed_price) if accepted_bid else int(project.budget)
            paid_total = Payment.objects.filter(
                project=project, status="COMPLETE"
            ).aggregate(total=models.Sum("amount"))["total"] or 0
            amount = total_price - int(paid_total)
        else: # FINAL
            from ProgressTracking.models import Milestone
            final_m = Milestone.objects.filter(project=project, title__icontains="Final").first()
            if final_m:
                 amount = int(final_m.amount)
            else:
                accepted_bid = Bid.objects.filter(project=project, status="ACCEPTED").first()
                amount = int(accepted_bid.proposed_price) if accepted_bid else 0

        if amount <= 0:
            return Response({"detail": "Invalid payment amount"}, status=400)

        product_code, secret_key, form_url = _get_esewa_settings()
        transaction_uuid = f"BH-{project.id}-{payment_type[:4]}-{uuid.uuid4().hex[:6]}"

        payment = Payment.objects.create(
            project=project,
            client=request.user,
            amount=amount,
            transaction_uuid=transaction_uuid,
            status="INITIATED",
            payment_type=payment_type,
            milestone_id=milestone_id if payment_type == "MILESTONE" else None
        )

        # Notify client that payment process has started
        notify(
            user=request.user,
            title=f"{payment_type.capitalize()} Payment Initiated",
            message=f"You started a {payment_type.lower()} payment of Rs {amount} for project \"{project.title}\".",
            type="PAYMENT",
            link=f"/clientdashboard?menu=my-projects&project={project.id}",
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

        t_uuid = payload["transaction_uuid"]

        # Worker Log Payment Verification
        if t_uuid.startswith("WLOG-"):
            work_log = get_object_or_404(WorkLog, transaction_uuid=t_uuid)
            
            if payload["status"].upper() != "COMPLETE":
                notify(
                    user=work_log.worker,
                    title="Payment Failed",
                    message=f"Contractor's payment for your log on {work_log.date} could not be successfully processed via eSewa.",
                    type="PAYMENT",
                    link="/worker?menu=myjobs",
                )
                return Response({"detail": "Worker payment not completed"}, status=400)
            
            work_log.payment_status = "PAID"
            work_log.save(update_fields=["payment_status"])

            notify(
                user=work_log.worker,
                title="Payment Received ✅",
                message=f"You have been paid via eSewa for your work log on {work_log.date} for {work_log.project.title}.",
                type="PAYMENT",
                link="/worker/dashboard?menu=myjobs",
            )
            return Response({"detail": "Worker log payment verified successfully"}, status=200)

        # Normal Client Project Payment Verification
        payment = get_object_or_404(Payment, transaction_uuid=t_uuid)
        project = payment.project
        payment_type = payment.payment_type

        if payload["status"].upper() != "COMPLETE":
            payment.status = "FAILED"
            payment.save()

            # Notify client about payment failure
            notify(
                user=payment.client,
                title="Payment Failed",
                message=f"Your {payment_type.lower()} payment for project \"{project.title}\" failed. Please try again.",
                type="PAYMENT",
                link=f"/clientdashboard?menu=my-projects&project={project.id}",
            )
            return Response({"detail": "Payment not completed"}, status=400)

        payment.status = "COMPLETE"
        payment.transaction_code = payload.get("transaction_code", "")
        payment.save()

        # Specific logic based on payment type
        if payment_type == "ADVANCE":
            project.advance_paid = True
            project.payment_status = "PARTIALLY_PAID"
            project.started_at = now()
            project.save()
            
            # Mark the Advance milestone as PAID
            from ProgressTracking.models import Milestone
            adv_m = Milestone.objects.filter(project=project, title__icontains="Advance").first()
            if adv_m:
                adv_m.status = "PAID"
                adv_m.save()

        elif payment_type == "MILESTONE":
            if payment.milestone:
                payment.milestone.status = "PAID"
                payment.milestone.save()
            
            if project.payment_status == "UNPAID":
                project.payment_status = "PARTIALLY_PAID"
                project.save()

        elif payment_type == "FINAL":
            project.payment_status = "PAID"
            project.status = "COMPLETED"
            project.paid_at = now()
            project.final_amount = payment.amount
            project.save()

            from ProgressTracking.models import Milestone
            final_m = Milestone.objects.filter(project=project, title__icontains="Final").first()
            if final_m:
                final_m.status = "PAID"
                final_m.save()

        elif payment_type == "REMAINING":
            project.payment_status = "PAID"
            project.paid_at = now()
            project.final_amount = payment.amount
            project.save()

            # Mark all unpaid milestones as PAID
            from ProgressTracking.models import Milestone
            Milestone.objects.filter(project=project).exclude(status="PAID").update(status="PAID")

        # Notify — payment confirmed
        notify(
            user=payment.client,
            title="Payment Successful ✅",
            message=f"Your {payment_type.lower()} payment of Rs {payment.amount} for \"{project.title}\" was successful.",
            type="PAYMENT",
            link=f"/clientdashboard?menu=my-projects&project={project.id}",
        )

        # Notify assigned contractor
        if project.assigned_contractor:
            notify(
                user=project.assigned_contractor,
                title="Payment Received",
                message=f"A {payment_type.lower()} payment of Rs {payment.amount} for project \"{project.title}\" has been received.",
                type="PAYMENT",
                link=f"/contractor?menu=projects&project={project.id}",
            )

        return Response({"detail": "Payment verified successfully"}, status=200)

class WorkerPaymentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'worker':
            # Return payments (work logs) for the worker
            work_logs = WorkLog.objects.filter(worker=request.user).select_related('project').order_by("-date")
            data = []
            for log in work_logs:
                # Find the most recent assignment to get the rate, regardless of current status
                assignment = ProjectAssignment.objects.filter(
                    worker=request.user, 
                    project=log.project
                ).order_by("-assigned_at").first()
                
                # Calculate amount similar to InitiateWorkerPaymentView
                try:
                    if assignment:
                        amount = int((assignment.rate / 8) * log.hours_worked)
                        if amount < 10:
                            amount = int(assignment.rate) if assignment.rate >= 10 else 10
                    else:
                        amount = 0
                except Exception:
                    amount = 0

                data.append({
                    "id": log.id,
                    "project_title": log.project.title,
                    "amount": amount,
                    "status": log.payment_status or "UNPAID",
                    "date": log.date.strftime("%Y-%m-%d"),
                })
            return Response(data)
        
        # Return payments for projects where the user is the assigned contractor
        payments = Payment.objects.filter(project__assigned_contractor=request.user).order_by("-created_at")
        
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

class InitiateWorkerPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, log_id):
        work_log = get_object_or_404(WorkLog, id=log_id)
        
        # Verify the user is the contractor assigned to this project
        if request.user.role != 'contractor' or work_log.project.assigned_contractor != request.user:
            return Response({"detail": "Not authorized to pay this log"}, status=403)
            
        if work_log.status != 'APPROVED':
            return Response({"detail": "Only approved logs can be paid"}, status=400)
            
        if work_log.payment_status == 'PAID':
            return Response({"detail": "Log is already paid"}, status=400)
            
        assignment = ProjectAssignment.objects.filter(worker=work_log.worker, project=work_log.project, status='ACTIVE').first()
        if not assignment:
            return Response({"detail": "Active project assignment not found."}, status=400)

        # Calculate amount: assume rate is daily, divided by 8 hours 
        # (Since amount needs to be an integer for eSewa, we cast it)
        try:
            amount = int((assignment.rate / 8) * work_log.hours_worked)
            if amount < 10:  # eSewa might have a minimum transaction amount, setting a basic floor
                amount = int(assignment.rate) if assignment.rate >= 10 else 10
        except Exception:
            amount = int(assignment.rate) if assignment.rate else 100

        product_code, secret_key, form_url = _get_esewa_settings()
        transaction_uuid = f"WLOG-{work_log.id}-{uuid.uuid4().hex[:6]}"
        
        work_log.transaction_uuid = transaction_uuid
        work_log.save(update_fields=["transaction_uuid"])

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
