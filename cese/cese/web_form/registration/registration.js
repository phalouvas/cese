frappe.ready(function() {
	const CARD_PAYMENT = "Card Payment"
	const OFFLINE_PAYMENT = "Offline Bank Transfer"
	const OFFLINE_PAYMENT_ROUTE = "/offline-payment-instructions"

	const setPricing = (grandTotal) => {
		return frappe.web_form.set_value("grand_total", grandTotal)
	}

	const getPaymentMethod = () => {
		return frappe.web_form.get_value("payment_method") || CARD_PAYMENT
	}

	const isOfflinePayment = () => {
		return getPaymentMethod() === OFFLINE_PAYMENT
	}

	const syncPaymentFlow = () => {
		const offlinePayment = isOfflinePayment()

		frappe.web_form.accept_payment = !offlinePayment

		if (offlinePayment) {
			frappe.web_form.set_value("status", "Pending")
		}
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
				setPricing(r.message ? r.message.grand_total : null)
			}
		})
	}

	frappe.web_form.on("ticket", setTicketAmount)
	frappe.web_form.on("payment_method", syncPaymentFlow)

	frappe.web_form.validate = () => {
		syncPaymentFlow()
		return true
	}

	const originalHandleSuccess = frappe.web_form.handle_success.bind(frappe.web_form)
	frappe.web_form.handle_success = (data) => {
		const registrationId =
			(data && typeof data === "object" && data.name) ||
			(frappe.web_form.doc && frappe.web_form.doc.name)

		if (isOfflinePayment()) {
			if (registrationId) {
				window.location.href = `${OFFLINE_PAYMENT_ROUTE}?registration=${encodeURIComponent(registrationId)}`
				return
			}

			return originalHandleSuccess(data)
		}

		if (typeof data === "string" && data) {
			window.location.href = data
			return
		}

		if (registrationId) {
			frappe.msgprint(
				`Registration ${registrationId} was created, but payment redirect failed. Please retry payment or contact support with this ID.`
			)
			return
		}

		return originalHandleSuccess(data)
	}

	syncPaymentFlow()
	setTicketAmount()
})