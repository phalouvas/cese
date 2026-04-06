from __future__ import annotations

import json
from typing import Any

import frappe
from frappe import _
from frappe.utils import get_datetime, now_datetime

MIN_SUBMIT_SECONDS = 3
MAX_SUBMIT_SECONDS = 24 * 60 * 60


@frappe.whitelist(allow_guest=True)
def submit_proposal(payload: str | dict[str, Any] | None = None) -> dict[str, Any]:
    data = _coerce_payload(payload)
    _validate_spam_guards(data)

    proposal_doc = frappe.get_doc(
        {
            "doctype": "Proposal",
            "proposal_type": data.get("proposal_type"),
            "submission_type": data.get("submission_type"),
            "working_group": data.get("working_group"),
            "panel_title": data.get("panel_title"),
            "panel_summary": data.get("panel_summary"),
            "primary_submitter_email": data.get("primary_submitter_email"),
            "primary_submitter_name": data.get("primary_submitter_name"),
            "status": "Submitted",
            "submitted_on": now_datetime(),
            "is_guest_submission": int(frappe.session.user == "Guest"),
            "source_ip": frappe.local.request_ip,
            "abstracts": data.get("abstracts") or [],
        }
    )

    proposal_doc.insert(ignore_permissions=True)
    frappe.db.commit()

    try:
        _send_admin_notification(proposal_doc)
        _send_submitter_confirmation(proposal_doc)
    except Exception:
        frappe.log_error(title="Proposal email notification failed", message=frappe.get_traceback())

    return {
        "name": proposal_doc.name,
        "status": proposal_doc.status,
        "submitted_on": proposal_doc.submitted_on,
    }


def _coerce_payload(payload: str | dict[str, Any] | None) -> dict[str, Any]:
    if not payload:
        frappe.throw(_("Missing submission payload."))

    if isinstance(payload, str):
        try:
            parsed = json.loads(payload)
        except json.JSONDecodeError:
            frappe.throw(_("Invalid JSON payload."))
        if not isinstance(parsed, dict):
            frappe.throw(_("Invalid payload format."))
        return parsed

    if isinstance(payload, dict):
        return payload

    frappe.throw(_("Invalid payload format."))


def _validate_spam_guards(data: dict[str, Any]) -> None:
    honeypot = data.get("honeypot")
    if honeypot:
        frappe.throw(_("Submission rejected."))

    started_at = data.get("form_started_at")
    if not started_at:
        frappe.throw(_("Missing submission timing marker."))

    started = get_datetime(started_at)
    elapsed = (now_datetime() - started).total_seconds()

    if elapsed < MIN_SUBMIT_SECONDS:
        frappe.throw(_("Submission was sent too quickly. Please try again."))

    if elapsed > MAX_SUBMIT_SECONDS:
        frappe.throw(_("Submission expired. Please refresh and submit again."))


def _send_admin_notification(proposal_doc: Any) -> None:
    recipients = _get_admin_recipients()
    if not recipients:
        return

    subject = _("New CESE proposal submitted: {0}").format(proposal_doc.name)
    message = _render_admin_message(proposal_doc)

    frappe.sendmail(
        recipients=recipients,
        subject=subject,
        message=message,
        delayed=False,
    )


def _send_submitter_confirmation(proposal_doc: Any) -> None:
    subject = _("Your CESE proposal was received ({0})").format(proposal_doc.name)
    message = _render_submitter_message(proposal_doc)

    frappe.sendmail(
        recipients=[proposal_doc.primary_submitter_email],
        subject=subject,
        message=message,
        delayed=False,
    )


def _get_admin_recipients() -> list[str]:
    configured = frappe.conf.get("proposal_admin_emails")
    if configured:
        if isinstance(configured, str):
            return [email.strip() for email in configured.split(",") if email.strip()]
        if isinstance(configured, list):
            return [email for email in configured if email]

    return frappe.get_all(
        "Has Role",
        filters={"role": "System Manager", "parenttype": "User"},
        pluck="parent",
    )


def _render_admin_message(proposal_doc: Any) -> str:
    return frappe.render_template(
        """
        <p>A new proposal has been submitted.</p>
        <p><strong>Proposal:</strong> {{ name }}</p>
        <p><strong>Type:</strong> {{ proposal_type }}</p>
        <p><strong>Submission Mode:</strong> {{ submission_type }}</p>
        <p><strong>Primary Submitter:</strong> {{ submitter_name }} ({{ submitter_email }})</p>
        <p><a href="{{ url }}">Open submission in Desk</a></p>
        """,
        {
            "name": proposal_doc.name,
            "proposal_type": proposal_doc.proposal_type,
            "submission_type": proposal_doc.submission_type,
            "submitter_name": proposal_doc.primary_submitter_name,
            "submitter_email": proposal_doc.primary_submitter_email,
            "url": f"{frappe.utils.get_url()}/app/proposal/{proposal_doc.name}",
        },
    )


def _render_submitter_message(proposal_doc: Any) -> str:
    return frappe.render_template(
        """
        <p>Dear {{ submitter_name }},</p>
        <p>Thank you for submitting your proposal to CESE.</p>
        <p><strong>Submission Reference:</strong> {{ name }}</p>
        <p>We will review your submission and follow up soon.</p>
        """,
        {
            "name": proposal_doc.name,
            "submitter_name": proposal_doc.primary_submitter_name,
        },
    )
