# CESE Project Guidelines

## Build And Test
- Follow setup and local tooling from [README.md](../README.md).
- Enable hooks for this repo with `pre-commit install`.
- Run quality checks with pre-commit (ruff, prettier, eslint) before finishing changes.
- Run focused Frappe tests from bench root, for example:
  - `bench --site tmp.localhost run-tests --app cese --module cese.cese.doctype.registration.test_registration`

## Architecture
- This app is a Frappe v16 application centered on DocTypes and website flows.
- Primary business modules:
  - Registration payment flow: `cese/cese/doctype/registration/`
  - Ticket catalog/pricing: `cese/cese/doctype/tickets/`
  - Proposal submission flow: `cese/cese/doctype/proposal/` and `cese/cese/doctype/proposal_abstract/`
  - Working groups: `cese/cese/doctype/working_group/`
- Public web entry points:
  - Web forms: `/registration`, `/submit-proposal` under `cese/cese/web_form/`
  - WWW pages: `/offline-payment-instructions`, `/payment-complete` under `cese/www/`
- Request-level redirect handling for payment callback is in `cese/utils.py` via `before_request` hook in `cese/hooks.py`.

## Code Style
- Respect repository formatting and lint config in [pyproject.toml](../pyproject.toml), [.pre-commit-config.yaml](../.pre-commit-config.yaml), [.editorconfig](../.editorconfig), and [.eslintrc](../.eslintrc).
- Python conventions in this repo:
  - Frappe `Document` controllers with lifecycle methods like `validate`, `after_insert`, and payment callbacks.
  - User-facing validation messages wrapped in `frappe._()` / `_()`.
  - DB reads via `frappe.db.get_value` and guard missing records with `frappe.throw`.
- Web form JavaScript conventions in this repo:
  - Use `frappe.ready`, `frappe.web_form.on`, `frappe.call`, and `frappe.web_form.validate` patterns.

## Project-Specific Guardrails
- Do not query a `currency` column from `Tickets` or `Registration`.
  - Both DocTypes rely on `grand_total` only; selecting `*.currency` can fail at runtime.
- Keep `Registration.reference_doctype` and `Registration.reference_name` attributes in place for PayPal Standard Payments compatibility.
- Preserve the dual payment flow behavior in registration:
  - `Card Payment` uses PayPal checkout finalization.
  - `Offline Bank Transfer` disables checkout and redirects to offline instructions.
- When changing registration payment logic, verify:
  - `cese/cese/web_form/registration/registration.js`
  - `cese/cese/doctype/registration/registration.py`
  - `cese/utils.py`

## Testing Conventions
- Prefer targeted integration tests for changed DocTypes first (see `cese/cese/doctype/**/test_*.py`).
- Registration tests are the reference for payment and pricing edge cases:
  - `cese/cese/doctype/registration/test_registration.py`

## Documentation
- Keep this file concise and link to source docs/config instead of duplicating details.
- If behavior is already documented in `README.md` or enforced by repo config, reference it rather than restating it.