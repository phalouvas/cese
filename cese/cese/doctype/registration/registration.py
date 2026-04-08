# Copyright (c) 2026, KAINOTOMO PH LTD and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _


class Registration(Document):
	def validate(self):
		if not self.ticket:
			self.grand_total = None
			self.currency = None
			return

		ticket_data = frappe.db.get_value(
			"Tickets", self.ticket, ["grand_total", "currency"], as_dict=True
		)

		if not ticket_data:
			frappe.throw(_("Ticket {0} does not exist.").format(frappe.bold(self.ticket)))

		self.grand_total = ticket_data.grand_total
		self.currency = ticket_data.currency

	def on_payment_authorized(self, status=None):
		if status not in ("Authorized", "Completed"):
			return

		transaction_id = frappe.db.get_value(
			"Integration Request",
			{
				"reference_doctype": self.doctype,
				"reference_docname": self.name,
				"integration_request_service": "PayPal Checkout",
				"status": "Completed",
			},
			"request_id",
			order_by="modified desc",
		)

		self.db_set(
			{
				"status": "Paid",
				"payment_transaction_id": transaction_id,
			},
			update_modified=False,
		)

		return frappe.utils.get_url(f"/registration?name={self.name}")
