# Copyright (c) 2026, KAINOTOMO PH LTD and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _


class Registration(Document):
	def validate(self):
		if not self.ticket:
			self.amount = None
			return

		ticket_amount = frappe.db.get_value("Tickets", self.ticket, "amount")

		if ticket_amount is None:
			frappe.throw(_("Ticket {0} does not exist.").format(frappe.bold(self.ticket)))

		self.amount = ticket_amount
