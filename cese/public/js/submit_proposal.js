(() => {
  const t = (text) => (typeof window.__ === 'function' ? window.__(text) : text);

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
  const submissionTypeBlock = root.querySelector('[data-submission-type-block]');
  const workingGroupBlock = root.querySelector('[data-working-group-block]');
  const panelGroupBlock = root.querySelector('[data-panel-group-block]');
  const abstractHint = root.querySelector('[data-abstract-hint]');

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

  const toggleHidden = (node, hidden) => {
    if (!node) return;
    node.classList.toggle('d-none', hidden);
  };

  const showStep = (stepNumber) => {
    if (stepNumber === 2) {
      toggleTypeBlocks();
    }

    currentStep = stepNumber;
    steps.forEach((step) => {
      step.classList.toggle('d-none', Number(step.dataset.step) !== stepNumber);
    });
    indicators.forEach((item, idx) => item.classList.toggle('active', idx + 1 === stepNumber));
    prevBtn.classList.toggle('d-none', stepNumber === 1);
    nextBtn.classList.toggle('d-none', stepNumber === 3);
    submitBtn.classList.toggle('d-none', stepNumber !== 3);
  };

  const proposalTypeLabel = (value) => {
    const map = {
      working_group: 'Working group',
      thematically_focused_panel: 'Thematically-focused panel',
      cross_thematic_session: 'Cross-thematic session',
    };
    return map[value] || value;
  };

  const submissionTypeLabel = (value) => {
    const map = {
      individual: 'Individual',
      group: 'Group',
    };
    return map[value] || value;
  };

  const selectedWorkingGroupLabel = () => {
    const field = getField('working_group');
    if (!field) return '';
    return field.options[field.selectedIndex]?.text || field.value;
  };

  const parseChoice = (name) => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  };

  const getSubmissionType = () => {
    const proposalType = parseChoice('proposal_type');
    if (proposalType === 'working_group') {
      return 'individual';
    }
    return parseChoice('submission_type') || 'individual';
  };

  const getField = (name) => form.querySelector(`[name="${name}"]`);

  const syncAbstractCards = (requiredCount) => {
    while (abstractsContainer.querySelectorAll('.abstract-card').length < requiredCount) {
      addAbstractCard();
    }

    while (abstractsContainer.querySelectorAll('.abstract-card').length > requiredCount) {
      const cards = abstractsContainer.querySelectorAll('.abstract-card');
      cards[cards.length - 1].remove();
    }

    refreshAbstractHeadings();
  };

  const toggleTypeBlocks = () => {
    const proposalType = parseChoice('proposal_type');
    const isWorkingGroup = proposalType === 'working_group';
    const submissionType = getSubmissionType();
    const isGroup = submissionType === 'group';
    const workingGroupField = getField('working_group');
    const panelTitleField = getField('panel_title');
    const panelSummaryField = getField('panel_summary');

    toggleHidden(submissionTypeBlock, isWorkingGroup);
    toggleHidden(workingGroupBlock, !isWorkingGroup);
    toggleHidden(panelGroupBlock, isWorkingGroup || !isGroup);

    if (isWorkingGroup) {
      if (workingGroupField) workingGroupField.required = true;
      if (panelTitleField) {
        panelTitleField.required = false;
        panelTitleField.value = '';
      }
      if (panelSummaryField) {
        panelSummaryField.required = false;
        panelSummaryField.value = '';
      }
      syncAbstractCards(1);
      if (abstractHint) abstractHint.textContent = t('Working group submissions require exactly 1 abstract.');
      return;
    }

    if (workingGroupField) workingGroupField.required = false;

    if (isGroup) {
      if (panelTitleField) panelTitleField.required = true;
      if (panelSummaryField) panelSummaryField.required = true;
      syncAbstractCards(4);
      if (abstractHint) abstractHint.textContent = t('Group submissions require 4 abstracts.');
    } else {
      if (panelTitleField) panelTitleField.required = false;
      if (panelSummaryField) panelSummaryField.required = false;
      syncAbstractCards(1);
      if (abstractHint) abstractHint.textContent = t('Individual submissions require exactly 1 abstract.');
    }
  };

  const addAbstractCard = () => {
    const count = abstractsContainer.querySelectorAll('.abstract-card').length;
    if (count >= 4) {
      return;
    }

    const card = document.createElement('div');
    card.className = 'card mb-3 abstract-card';
    card.innerHTML = `
      <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="h5 mb-0">Abstract ${count + 1}</h4>
      </div>
      <label class="form-label">Abstract Title</label>
      <input class="form-control" type="text" data-field="abstract_title" required>
      <label class="form-label mt-3">Abstract Details</label>
      <textarea class="form-control" rows="4" data-field="abstract_details" required></textarea>
      <h5 class="h6 mt-4">Authors</h5>
      <p class="text-muted small">Author 1 is required. Fill author 2-4 only if needed.</p>
      <div class="row g-4">
        ${[1,2,3,4].map((n) => `
        <div class="col-12 col-md-6 mb-2 mb-md-3">
          <div class="card h-100 border-secondary-subtle">
            <div class="card-body">
              <h6 class="card-title mb-3">Author ${n}</h6>
              <label class="form-label">Name</label>
              <input class="form-control" type="text" data-field="author_${n}_name">
              <label class="form-label mt-2">Surname</label>
              <input class="form-control" type="text" data-field="author_${n}_surname">
              <label class="form-label mt-2">Email</label>
              <input class="form-control" type="email" data-field="author_${n}_email">
              <label class="form-label mt-2">Affiliation</label>
              <input class="form-control" type="text" data-field="author_${n}_affiliation">
            </div>
          </div>
        </div>`).join('')}
      </div>
      </div>
    `;

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
      submission_type: getSubmissionType(),
      working_group: (getField('working_group')?.value || '').trim(),
      panel_title: (getField('panel_title')?.value || '').trim(),
      panel_summary: (getField('panel_summary')?.value || '').trim(),
      honeypot: form.honeypot.value,
      form_started_at: startedAt,
      abstracts: collectAbstracts(),
    };
  };

  const validateStepOne = () => {
    if (!parseChoice('proposal_type')) {
      frappe.msgprint(t('Please select proposal type.'));
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    const payload = collectPayload();
    if (payload.proposal_type === 'working_group' && !payload.working_group) {
      frappe.msgprint(t('Working group is required.'));
      return false;
    }

    if (
      payload.proposal_type !== 'working_group'
      && payload.submission_type === 'group'
      && (!payload.panel_title || !payload.panel_summary)
    ) {
      frappe.msgprint(t('Panel title and summary are required.'));
      return false;
    }

    if (payload.submission_type === 'individual' && payload.abstracts.length !== 1) {
      frappe.msgprint(t('Individual submissions require exactly one abstract.'));
      return false;
    }

    if (payload.submission_type === 'group' && payload.abstracts.length !== 4) {
      frappe.msgprint(t('Group submissions require exactly four abstracts.'));
      return false;
    }

    for (let i = 0; i < payload.abstracts.length; i += 1) {
      const abstract = payload.abstracts[i] || {};
      const labelIndex = i + 1;

      if (!abstract.abstract_title) {
        frappe.msgprint(t(`Abstract ${labelIndex}: title is required.`));
        return false;
      }

      if (!abstract.abstract_details) {
        frappe.msgprint(t(`Abstract ${labelIndex}: details are required.`));
        return false;
      }

      if (!abstract.author_1_name || !abstract.author_1_surname || !abstract.author_1_email) {
        frappe.msgprint(t(`Abstract ${labelIndex}: author 1 name, surname, and email are required.`));
        return false;
      }
    }

    return true;
  };

  const renderReview = () => {
    const payload = collectPayload();
    const firstAbstract = payload.abstracts[0] || {};
    const primaryAuthorName = [firstAbstract.author_1_name, firstAbstract.author_1_surname]
      .filter(Boolean)
      .join(' ');

    const summaryRows = [
      {
        label: 'Group Type',
        value: proposalTypeLabel(payload.proposal_type),
      },
    ];

    if (payload.proposal_type === 'working_group') {
      summaryRows.push({
        label: 'Select Working Group',
        value: selectedWorkingGroupLabel(),
      });
    }

    if (payload.proposal_type !== 'working_group') {
      summaryRows.push({
        label: 'Submission Type',
        value: submissionTypeLabel(payload.submission_type),
      });
    }

    if (payload.panel_title) {
      summaryRows.push({ label: 'Panel/Session Title', value: payload.panel_title });
    }

    if (payload.panel_summary) {
      summaryRows.push({ label: 'Panel/Session Summary', value: payload.panel_summary });
    }

    if (payload.abstracts[0]?.abstract_title) {
      summaryRows.push({ label: 'Abstract Title', value: payload.abstracts[0].abstract_title });
    }

    if (primaryAuthorName || firstAbstract.author_1_email) {
      summaryRows.push({
        label: 'Author 1',
        value: `${primaryAuthorName}${firstAbstract.author_1_email ? `<br>${escapeHtml(firstAbstract.author_1_email)}` : ''}`,
      });
    }

    const rowsHtml = summaryRows
      .map(
        (row) => `
          <div class="row py-3 border-top">
            <div class="col-md-4"><strong>${escapeHtml(row.label)}:</strong></div>
            <div class="col-md-8">${row.value}</div>
          </div>
        `,
      )
      .join('');

    reviewBlock.innerHTML = `
      <div class="card mb-3">
        <div class="card-body">
          ${rowsHtml}
        </div>
      </div>
    `;
  };

  nextBtn.addEventListener('click', () => {
    if (currentStep === 1 && !validateStepOne()) return;
    if (currentStep === 2 && !validateStepTwo()) return;

    if (currentStep === 1) {
      toggleTypeBlocks();
    }

    const nextStep = Math.min(currentStep + 1, 3);
    if (nextStep === 3) renderReview();
    showStep(nextStep);
  });

  prevBtn.addEventListener('click', () => {
    showStep(Math.max(currentStep - 1, 1));
  });

  form.addEventListener('change', (event) => {
    if (event.target.name === 'proposal_type' || event.target.name === 'submission_type') {
      toggleTypeBlocks();
    }
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
      freeze_message: t('Submitting proposal...'),
      callback: (response) => {
        if (!response.message) return;
        form.classList.add('d-none');
        successBlock.classList.remove('d-none');
        refNode.textContent = response.message.name;
      },
      error: (err) => {
        if (err && err.message) {
          frappe.msgprint(err.message);
        }
      },
    });
  });

  toggleTypeBlocks();
  showStep(1);
})();
