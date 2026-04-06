### Cese

Serves CESE conferences

### Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch version-16
bench install-app cese
```

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/cese
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

### Submit Proposal Feature

This app now includes a public multi-step proposal submission flow inspired by the CESE Joomla implementation.

- Public route: `/submit-proposal`
- Backend endpoint: `cese.api.proposal.submit_proposal`
- Storage: `Proposal` DocType with `Proposal Abstract` child table

To configure admin notifications, set `proposal_admin_emails` in your site config:

```json
{
	"proposal_admin_emails": ["conference-admin@example.org", "submissions@example.org"]
}
```

If `proposal_admin_emails` is not set, notifications fall back to users with the `System Manager` role.

### License

mit
