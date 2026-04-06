from __future__ import annotations

from typing import Any

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import validate_email_address

ALLOWED_PROPOSAL_TYPES = {
    "working_group",
    "thematically_focused_panel",
    "cross_thematic_session",
}
ALLOWED_SUBMISSION_TYPES = {"individual", "group"}
ALLOWED_WORKING_GROUPS = {"wg1", "wg2", "wg3", "wg4", "wg5", "wg6", "wg7"}


class Proposal(Document):
    def validate(self) -> None:
        self._validate_types()
        self._validate_header_fields()
        self._validate_abstracts()

    def _validate_types(self) -> None:
        if self.proposal_type not in ALLOWED_PROPOSAL_TYPES:
            frappe.throw(_("Invalid proposal type."))

        if self.submission_type not in ALLOWED_SUBMISSION_TYPES:
            frappe.throw(_("Invalid submission type."))

    def _validate_header_fields(self) -> None:
        if self.proposal_type == "working_group" and not self.working_group:
            frappe.throw(_("Working group is required for working group proposals."))

        if self.proposal_type == "working_group" and self.working_group not in ALLOWED_WORKING_GROUPS:
            frappe.throw(_("Invalid working group."))

        if self.proposal_type != "working_group":
            if not self.panel_title:
                frappe.throw(_("Panel/session title is required."))
            if not self.panel_summary:
                frappe.throw(_("Panel/session summary is required."))

        if not self.primary_submitter_email:
            frappe.throw(_("Primary submitter email is required."))

        validate_email_address(self.primary_submitter_email, throw=True)

        if not self.primary_submitter_name:
            frappe.throw(_("Primary submitter name is required."))

    def _validate_abstracts(self) -> None:
        abstracts: list[Any] = self.get("abstracts") or []

        if not abstracts:
            frappe.throw(_("At least one abstract is required."))

        if self.submission_type == "individual" and len(abstracts) != 1:
            frappe.throw(_("Individual submissions require exactly one abstract."))

        if self.submission_type == "group" and len(abstracts) > 4:
            frappe.throw(_("Group submissions allow up to four abstracts."))

        for idx, row in enumerate(abstracts, start=1):
            _validate_abstract_row(row, idx)


def _validate_abstract_row(row: Any, index: int) -> None:
    if not row.abstract_title:
        frappe.throw(_("Abstract {0}: title is required.").format(index))

    if not row.abstract_details:
        frappe.throw(_("Abstract {0}: details are required.").format(index))

    for author_num in range(1, 5):
        name = row.get(f"author_{author_num}_name")
        surname = row.get(f"author_{author_num}_surname")
        email = row.get(f"author_{author_num}_email")
        affiliation = row.get(f"author_{author_num}_affiliation")
        has_any_value = any([name, surname, email, affiliation])

        if author_num == 1 and not has_any_value:
            frappe.throw(_("Abstract {0}: author 1 information is required.").format(index))

        if not has_any_value:
            continue

        if not name or not surname or not email:
            frappe.throw(
                _("Abstract {0}: author {1} must include name, surname, and email.").format(
                    index, author_num
                )
            )

        validate_email_address(email, throw=True)
