import frappe
from frappe import _

def get_context(context):
	# do your magic here
	pass


@frappe.whitelist(allow_guest=True)
def get_ticket_pricing(ticket):
	if not ticket:
		return {"amount": None}

	ticket_data = frappe.db.get_value("Tickets", ticket, ["amount"], as_dict=True)

	if not ticket_data:
		frappe.throw(_("Ticket {0} does not exist.").format(frappe.bold(ticket)))

	return {
		"amount": ticket_data.amount,
	}
