import frappe


def get_context(context):
	registration = frappe.form_dict.get("registration")
	context.registration = registration
	context.registration_exists = bool(registration and frappe.db.exists("Registration", registration))
