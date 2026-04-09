# Copyright (c) 2026, KAINOTOMO PH LTD and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _
from frappe.utils import fmt_money


class Registration(Document):
	# paypalstandardpayments reads these fields generically for Sales Order flows.
	# Keep them on this controller to avoid attribute errors for Registration payments.
	reference_doctype = None
	reference_name = None

	def validate(self):
		if not self.ticket:
			self.grand_total = None
			return

		ticket_data = frappe.db.get_value(
			"Tickets", self.ticket, ["grand_total"], as_dict=True
		)

		if not ticket_data:
			frappe.throw(_("Ticket {0} does not exist.").format(frappe.bold(self.ticket)))

		self.grand_total = ticket_data.grand_total

	def after_insert(self):
		if self.payment_method == "Offline Bank Transfer":
			self.send_offline_payment_email()

	def on_payment_authorized(self, status=None):
		if status != "Completed":
			return

		if self.payment_method == "Offline Bank Transfer":
			return frappe.utils.get_url(f"/offline-payment-instructions?registration={self.name}")

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

		if self.status == "Paid" and self.payment_transaction_id == transaction_id:
			return frappe.utils.get_url(f"/payment-complete?registration={self.name}")

		self.db_set(
			{
				"status": "Paid",
				"payment_transaction_id": transaction_id,
			},
			update_modified=False,
		)

		self.send_card_payment_completed_email(transaction_id)

		return frappe.utils.get_url(f"/payment-complete?registration={self.name}")

	def get_email_context(self, transaction_code=None):
		ticket_title = (
			frappe.db.get_value("Tickets", self.ticket, "title") if self.ticket else None
		)
		full_name = " ".join(filter(None, [self.first_name, self.last_name]))
		amount = fmt_money(self.grand_total, currency="EUR")

		return {
			"full_name": full_name,
			"event_title": "CESE Conference",
			"event_date": "To be announced",
			"event_end_date": "To be announced",
			"ticket_title": ticket_title or self.ticket,
			"amount": amount,
			"transaction_code": transaction_code or self.name,
			"registration_id": self.name,
			"organization": self.organization,
			"city": self.city,
			"country": self.country,
			"email": self.email,
			"phone": self.phone,
		}

	def get_registration_pdf_attachment(self):
		return frappe.attach_print(
			self.doctype,
			self.name,
			file_name=f"Registration-{self.name}",
			print_letterhead=True,
		)

	def send_registration_email(self, subject, message):
		if not self.email:
			return

		frappe.sendmail(
			recipients=[self.email],
			subject=subject,
			message=message,
			reference_doctype=self.doctype,
			reference_name=self.name,
			attachments=[self.get_registration_pdf_attachment()],
		)

	def send_offline_payment_email(self):
		context = self.get_email_context(transaction_code=self.name)
		subject = _("Registration Received: Offline Payment Instructions")
		message = frappe.render_template(
			"""
			<p>Dear <strong>{{ full_name }}</strong>,</p>
			<p>You have just registered for event <strong>{{ event_title }}</strong>.</p>
			<p><strong>Please complete your payment within 3 days</strong> to confirm your attendance.</p>
			<div style="background-color: #fff4e5; border-left: 6px solid #e67e22; padding: 10px; margin: 15px 0;">
				<strong>Amount Due:</strong> <span style="font-size: 1.1em; color: #e74c3c;">{{ amount }}</span>
			</div>
			<h3>Registrant Details</h3>
			<ul>
				<li><strong>Name:</strong> {{ full_name }}</li>
				<li><strong>Organization:</strong> {{ organization }}</li>
				<li><strong>Location:</strong> {{ city }}, {{ country }}</li>
				<li><strong>Email:</strong> {{ email }}</li>
				<li><strong>Phone:</strong> {{ phone }}</li>
			</ul>
			<h3>Event Information</h3>
			<ul>
				<li><strong>Event:</strong> {{ event_title }}</li>
				<li><strong>Dates:</strong> {{ event_date }} - {{ event_end_date }}</li>
				<li><strong>Ticket Type:</strong> {{ ticket_title }}</li>
				<li><strong>Amount Due:</strong> {{ amount }}</li>
				<li><strong>Payment Method:</strong> Offline Bank Transfer</li>
				<li><strong>Transaction Code:</strong> <span style="color: #e74c3c;"><strong>{{ transaction_code }}</strong></span></li>
			</ul>
			<h3>Bank Transfer Instructions</h3>
			<ul>
				<li><strong>Bank:</strong> Eurobank</li>
				<li><strong>Account Holder:</strong> KAINOTOMO PH LTD</li>
				<li><strong>IBAN:</strong> CY11 0050 0301 0003 0110 7136 5301</li>
				<li><strong>BIC/SWIFT:</strong> HEBACY2N</li>
				<li><strong>Payment Reference:</strong> <span style="color: #e74c3c;"><strong>{{ transaction_code }}</strong></span></li>
			</ul>
			<p><em>Please include reference code <strong>{{ transaction_code }}</strong> in your transfer remarks.</em></p>
			<p>Regards,<br>Events Management Team</p>
			""",
			context,
		)

		self.send_registration_email(subject, message)

	def send_card_payment_completed_email(self, transaction_id):
		context = self.get_email_context(transaction_code=transaction_id or self.name)
		subject = _("Payment Completed: Registration Confirmed")
		message = frappe.render_template(
			"""
			<p>Dear <strong>{{ full_name }}</strong>,</p>
			<p>Your payment has been completed successfully for <strong>{{ event_title }}</strong>.</p>
			<div style="background-color: #eafaf1; border-left: 6px solid #27ae60; padding: 10px; margin: 15px 0;">
				<strong>Payment Confirmed:</strong> <span style="font-size: 1.1em; color: #1e8449;">{{ amount }}</span>
			</div>
			<h3>Registrant Details</h3>
			<ul>
				<li><strong>Name:</strong> {{ full_name }}</li>
				<li><strong>Organization:</strong> {{ organization }}</li>
				<li><strong>Location:</strong> {{ city }}, {{ country }}</li>
				<li><strong>Email:</strong> {{ email }}</li>
				<li><strong>Phone:</strong> {{ phone }}</li>
			</ul>
			<h3>Event Information</h3>
			<ul>
				<li><strong>Event:</strong> {{ event_title }}</li>
				<li><strong>Dates:</strong> {{ event_date }} - {{ event_end_date }}</li>
				<li><strong>Ticket Type:</strong> {{ ticket_title }}</li>
				<li><strong>Amount Paid:</strong> {{ amount }}</li>
				<li><strong>Payment Method:</strong> Card Payment</li>
				<li><strong>Transaction Code:</strong> <span style="color: #1e8449;"><strong>{{ transaction_code }}</strong></span></li>
				<li><strong>Registration ID:</strong> {{ registration_id }}</li>
			</ul>
			<h3>Next Steps</h3>
			<ol>
				<li>Your seat is now confirmed.</li>
			</ol>
			<p>Regards,<br>Events Management Team</p>
			""",
			context,
		)

		self.send_registration_email(subject, message)
