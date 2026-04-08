frappe.ready(function() {
	const setTicketAmount = () => {
		const ticket = frappe.web_form.get_value("ticket")

		if (!ticket) {
			frappe.web_form.set_value("amount", null)
			return
		}

		frappe.call({
			method: "frappe.client.get_value",
			args: {
				doctype: "Tickets",
				filters: { name: ticket },
				fieldname: "amount"
			},
			callback: (r) => {
				frappe.web_form.set_value("amount", r.message ? r.message.amount : null)
			}
		})
	}

	frappe.web_form.on("ticket", setTicketAmount)
	setTicketAmount()
})