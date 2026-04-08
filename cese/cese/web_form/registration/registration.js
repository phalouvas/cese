frappe.ready(function() {
	const setPricing = (amount) => {
		return frappe.web_form.set_value("amount", amount)
	}

	const setTicketAmount = () => {
		const ticket = frappe.web_form.get_value("ticket")

		if (!ticket) {
			return setPricing(null)
		}

		return frappe.call({
			method: "cese.cese.web_form.registration.registration.get_ticket_pricing",
			args: {
				ticket
			},
			callback: (r) => {
				setPricing(r.message ? r.message.amount : null)
			}
		})
	}

	frappe.web_form.on("ticket", setTicketAmount)
	setTicketAmount()
})