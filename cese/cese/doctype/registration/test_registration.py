# Copyright (c) 2026, KAINOTOMO PH LTD and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import fmt_money


# On IntegrationTestCase, the doctype test records and all
# link-field test record dependencies are recursively loaded
# Use these module variables to add/remove to/from that list
EXTRA_TEST_RECORD_DEPENDENCIES = []  # eg. ["User"]
IGNORE_TEST_RECORD_DEPENDENCIES = []  # eg. ["User"]



class IntegrationTestRegistration(IntegrationTestCase):
	"""
	Integration tests for Registration.
	Use this class for testing interactions between multiple components.
	"""

	def _get_any_country(self):
		country = frappe.db.get_value("Country", {}, "name")
		if not country:
			self.skipTest("No Country records available for Registration tests.")
		return country

	def _make_ticket(self, grand_total=100):
		ticket_id = frappe.generate_hash(length=10).upper()
		return frappe.get_doc(
			{
				"doctype": "Tickets",
				"code": f"TST-{ticket_id}",
				"title": f"Test Ticket {ticket_id}",
				"grand_total": grand_total,
			}
		).insert(ignore_permissions=True)

	def _make_registration(self, ticket_name):
		country = self._get_any_country()
		return frappe.get_doc(
			{
				"doctype": "Registration",
				"ticket": ticket_name,
				"payment_method": "Card Payment",
				"first_name": "Test",
				"last_name": "User",
				"organization": "CESE QA",
				"city": "Nicosia",
				"country": country,
				"phone": "+35700000000",
				"email": "test.registration@example.com",
			}
		).insert(ignore_permissions=True)

	def test_registration_insert_sets_grand_total_from_ticket(self):
		ticket = self._make_ticket(grand_total=149.5)
		registration = self._make_registration(ticket.name)

		self.assertEqual(registration.grand_total, ticket.grand_total)

	def test_email_context_formats_amount_with_eur_without_currency_field(self):
		ticket = self._make_ticket(grand_total=89)
		registration = self._make_registration(ticket.name)

		context = registration.get_email_context()
		expected_amount = fmt_money(registration.grand_total, currency="EUR")

		self.assertEqual(context["amount"], expected_amount)
