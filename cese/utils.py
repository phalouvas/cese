from urllib.parse import quote

import frappe


def before_request():
	request = getattr(frappe.local, "request", None)
	if not request:
		return

	if request.path.rstrip("/") != "/payment-success":
		return

	form_dict = frappe.local.form_dict
	doctype = (form_dict.get("doctype") or "").strip().lower()
	docname = (form_dict.get("docname") or "").strip()

	if doctype != "registration" or not docname:
		return

	if form_dict.get("redirect_to"):
		return

	encoded_docname = quote(docname, safe="")
	form_dict["redirect_to"] = f"/payment-complete?registration={encoded_docname}"
