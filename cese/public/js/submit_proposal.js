(() => {
  const root = document.querySelector('#cese-proposal-app');
  if (!root) return;

  const form = root.querySelector('#cese-proposal-form');
  const steps = [...root.querySelectorAll('.wizard-step')];
  const indicators = [...root.querySelectorAll('[data-step-indicator] .step')];
  const prevBtn = root.querySelector('[data-prev]');
  const nextBtn = root.querySelector('[data-next]');
  const submitBtn = root.querySelector('[data-submit]');
  const reviewBlock = root.querySelector('[data-review]');
  const successBlock = root.querySelector('[data-success]');
  const refNode = root.querySelector('[data-reference]');
  const abstractsContainer = root.querySelector('[data-abstracts]');
  const addAbstractBtn = root.querySelector('[data-add-abstract]');
  const workingGroupBlock = root.querySelector('[data-working-group-block]');
  const panelBlock = root.querySelector('[data-panel-block]');

  let currentStep = 1;
  const startedAt = new Date().toISOString();

  const escapeHtml = (value) => {
    const text = String(value || '');
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  };

  const showStep = (stepNumber) => {
    currentStep = stepNumber;
    steps.forEach((step) => {
      step.classList.toggle('hidden', Number(step.dataset.step) !== stepNumber);
    });
    indicators.forEach((item, idx) => item.classList.toggle('active', idx + 1 === stepNumber));
    prevBtn.classList.toggle('hidden', stepNumber === 1);
    nextBtn.classList.toggle('hidden', stepNumber === 3);
    submitBtn.classList.toggle('hidden', stepNumber !== 3);
  };

  const parseChoice = (name) => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  };

  const toggleTypeBlocks = () => {
    const proposalType = parseChoice('proposal_type');
    const isWorkingGroup = proposalType === 'working_group';
    workingGroupBlock.classList.toggle('hidden', !isWorkingGroup);
    panelBlock.classList.toggle('hidden', isWorkingGroup);
  };

  const addAbstractCard = () => {
    const count = abstractsContainer.querySelectorAll('.abstract-card').length;
    if (count >= 4) {
      frappe.msgprint(__('You can only add up to 4 abstracts.'));
      return;
    }

    const card = document.createElement('div');
    card.className = 'abstract-card';
    card.innerHTML = `
      <div class="abstract-meta">
        <h4>Abstract ${count + 1}</h4>
        <button type="button" data-remove-abstract>Remove</button>
      </div>
      <label>Abstract Title</label>
      <input type="text" data-field="abstract_title" required>
      <label>Abstract Details</label>
      <textarea rows="4" data-field="abstract_details" required></textarea>
      <h5>Authors</h5>
      <p class="hint">Author 1 is required. Fill author 2-4 only if needed.</p>
      <div class="authors-grid">
        ${[1,2,3,4].map((n) => `
        <div>
          <label>Author ${n} Name</label>
          <input type="text" data-field="author_${n}_name">
          <label>Author ${n} Surname</label>
          <input type="text" data-field="author_${n}_surname">
          <label>Author ${n} Email</label>
          <input type="email" data-field="author_${n}_email">
          <label>Author ${n} Affiliation</label>
          <input type="text" data-field="author_${n}_affiliation">
        </div>`).join('')}
      </div>
    `;

    card.querySelector('[data-remove-abstract]').addEventListener('click', () => {
      card.remove();
      refreshAbstractHeadings();
    });

    abstractsContainer.appendChild(card);
    refreshAbstractHeadings();
  };

  const refreshAbstractHeadings = () => {
    [...abstractsContainer.querySelectorAll('.abstract-card')].forEach((card, idx) => {
      card.querySelector('h4').textContent = `Abstract ${idx + 1}`;
    });
  };

  const collectAbstracts = () => {
    return [...abstractsContainer.querySelectorAll('.abstract-card')].map((card) => {
      const row = {};
      card.querySelectorAll('[data-field]').forEach((input) => {
        row[input.dataset.field] = input.value.trim();
      });
      return row;
    });
  };

  const collectPayload = () => {
    return {
      proposal_type: parseChoice('proposal_type'),
      submission_type: parseChoice('submission_type'),
      working_group: form.working_group.value,
      panel_title: form.panel_title.value.trim(),
      panel_summary: form.panel_summary.value.trim(),
      primary_submitter_name: form.primary_submitter_name.value.trim(),
      primary_submitter_email: form.primary_submitter_email.value.trim(),
      honeypot: form.honeypot.value,
      form_started_at: startedAt,
      abstracts: collectAbstracts(),
    };
  };

  const validateStepOne = () => {
    if (!parseChoice('proposal_type') || !parseChoice('submission_type')) {
      frappe.msgprint(__('Please select proposal type and submission mode.'));
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    const payload = collectPayload();
    if (payload.proposal_type === 'working_group' && !payload.working_group) {
      frappe.msgprint(__('Working group is required.'));
      return false;
    }

    if (payload.proposal_type !== 'working_group' && (!payload.panel_title || !payload.panel_summary)) {
      frappe.msgprint(__('Panel title and summary are required.'));
      return false;
    }

    if (!payload.primary_submitter_name || !payload.primary_submitter_email) {
      frappe.msgprint(__('Primary submitter details are required.'));
      return false;
    }

    if (payload.submission_type === 'individual' && payload.abstracts.length !== 1) {
      frappe.msgprint(__('Individual submissions require exactly one abstract.'));
      return false;
    }

    if (payload.submission_type === 'group' && (payload.abstracts.length < 1 || payload.abstracts.length > 4)) {
      frappe.msgprint(__('Group submissions allow one to four abstracts.'));
      return false;
    }

    return true;
  };

  const renderReview = () => {
    const payload = collectPayload();
    reviewBlock.innerHTML = `
      <p><strong>Proposal Type:</strong> ${escapeHtml(payload.proposal_type)}</p>
      <p><strong>Submission Type:</strong> ${escapeHtml(payload.submission_type)}</p>
      ${payload.working_group ? `<p><strong>Working Group:</strong> ${escapeHtml(payload.working_group)}</p>` : ''}
      ${payload.panel_title ? `<p><strong>Panel Title:</strong> ${escapeHtml(payload.panel_title)}</p>` : ''}
      <p><strong>Primary Submitter:</strong> ${escapeHtml(payload.primary_submitter_name)} (${escapeHtml(payload.primary_submitter_email)})</p>
      <p><strong>Abstract Count:</strong> ${payload.abstracts.length}</p>
    `;
  };

  nextBtn.addEventListener('click', () => {
    if (currentStep === 1 && !validateStepOne()) return;
    if (currentStep === 2 && !validateStepTwo()) return;

    const nextStep = Math.min(currentStep + 1, 3);
    if (nextStep === 3) renderReview();
    showStep(nextStep);
  });

  prevBtn.addEventListener('click', () => {
    showStep(Math.max(currentStep - 1, 1));
  });

  addAbstractBtn.addEventListener('click', addAbstractCard);
  form.addEventListener('change', (event) => {
    if (event.target.name === 'proposal_type') toggleTypeBlocks();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateStepTwo()) {
      showStep(2);
      return;
    }

    const payload = collectPayload();
    frappe.call({
      method: 'cese.api.proposal.submit_proposal',
      args: {
        payload: JSON.stringify(payload),
      },
      freeze: true,
      freeze_message: __('Submitting proposal...'),
      callback: (response) => {
        if (!response.message) return;
        form.classList.add('hidden');
        successBlock.classList.remove('hidden');
        refNode.textContent = response.message.name;
      },
      error: (err) => {
        if (err && err.message) {
          frappe.msgprint(err.message);
        }
      },
    });
  });

  addAbstractCard();
  toggleTypeBlocks();
  showStep(1);
})();
