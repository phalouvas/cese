frappe.ready(function() {
	if (frappe.web_form.fields_dict?.amount?.df) {
		frappe.web_form.fields_dict.amount.df.options = "currency"
	}

	const setTicketAmount = () => {
		const ticket = frappe.web_form.get_value("ticket")

		if (!ticket) {
			frappe.web_form.set_value("currency", "EUR")
			frappe.web_form.set_value("amount", null)
			return
		}

		frappe.call({
			method: "frappe.client.get_value",
			args: {
				doctype: "Tickets",
				filters: { name: ticket },
				fieldname: ["amount", "currency"]
			},
			callback: (r) => {
				frappe.web_form.set_value("currency", r.message ? r.message.currency : "EUR")
				frappe.web_form.set_value("amount", r.message ? r.message.amount : null)
			}
		})
	}

	frappe.web_form.on("ticket", setTicketAmount)
	setTicketAmount()
})