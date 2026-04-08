import frappe


def get_context(context):
	registration = (frappe.form_dict.get("registration") or "").strip()
	context.registration = registration
	context.registration_exists = bool(registration and frappe.db.exists("Registration", registration))

	if not context.registration_exists:
		return

	registration_doc = frappe.get_doc("Registration", registration)
	ticket_title = frappe.db.get_value("Tickets", registration_doc.ticket, "title") if registration_doc.ticket else None

	full_name = " ".join(filter(None, [registration_doc.first_name, registration_doc.last_name]))
	reference_code = registration_doc.payment_transaction_id or registration_doc.name

	context.registration_doc = registration_doc
	context.full_name = full_name
	context.ticket_title = ticket_title
	context.reference_code = reference_code

	# These are kept as editable defaults until event metadata is modeled in DocTypes.
	context.event_title = "CESE Conference"
	context.event_date = "To be announced"
	context.event_end_date = "To be announced"
