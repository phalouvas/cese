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
