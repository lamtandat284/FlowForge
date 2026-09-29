(() => {
  'use strict';
  const { spec, blueprint } = JSON.parse(document.getElementById('mockup-data').textContent);
  const app = document.getElementById('app');
  const storagePrefix = `flowforge:${spec.runId}:`;
  const records = (collection) => {
    try { return JSON.parse(localStorage.getItem(storagePrefix + collection) ?? '[]'); }
    catch { return []; }
  };
  const saveRecords = (collection, items) => localStorage.setItem(storagePrefix + collection, JSON.stringify(items));
  const element = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  let notice = '';

  function currentScreen() {
    const id = decodeURIComponent(location.hash.slice(1));
    return blueprint.screens.find((screen) => screen.id === id) ?? blueprint.screens.find((screen) => screen.id === blueprint.navigation.entryScreenId);
  }

  function navigate(id) {
    location.hash = encodeURIComponent(id);
    render();
  }

  function appendTable(container, screen, component) {
    const items = records(screen.dataSource.collection);
    if (items.length === 0) {
      container.append(element('p', 'empty', 'Chưa có dữ liệu.'));
      return;
    }
    const wrapper = element('div', 'table-scroll');
    const table = element('table');
    const head = element('thead');
    const headRow = element('tr');
    for (const column of component.columns) headRow.append(element('th', '', column.label));
    head.append(headRow);
    table.append(head);
    const body = element('tbody');
    for (const item of items) {
      const row = element('tr');
      for (const column of component.columns) row.append(element('td', '', item[column.field] == null ? '' : String(item[column.field])));
      body.append(row);
    }
    table.append(body);
    wrapper.append(table);
    container.append(wrapper);
  }

  function appendInput(container, component) {
    const group = element('div', 'field');
    const label = element('label', '', component.label + (component.required ? ' *' : ''));
    const input = element('input');
    input.name = component.field;
    input.id = component.id;
    input.type = component.type === 'date-input' ? 'date' : 'text';
    input.required = Boolean(component.required);
    label.htmlFor = input.id;
    group.append(label, input);
    container.append(group);
  }

  function submit(screen, action, form, errorBox) {
    errorBox.textContent = '';
    if (!form.reportValidity()) return;
    const record = Object.fromEntries(new FormData(form));
    for (const validation of action.behavior?.validations ?? []) {
      if (validation.type === 'date-order' && record[validation.startField] && record[validation.endField] && record[validation.endField] < record[validation.startField]) {
        errorBox.textContent = validation.message || 'Ngày kết thúc không hợp lệ.';
        form.elements.namedItem(validation.endField)?.focus();
        return;
      }
    }
    const collection = action.behavior.collection;
    const item = { ...record, ...(action.behavior.defaults ?? {}) };
    saveRecords(collection, [item, ...records(collection)]);
    notice = 'Đã lưu thành công.';
    const flow = blueprint.flows.find((entry) => entry.from === screen.id && entry.actionId === action.id);
    if (flow) navigate(flow.to);
    else render();
  }

  function render() {
    const screen = currentScreen();
    document.title = `${screen.title} — ${spec.project.name}`;
    app.replaceChildren();
    const shell = element('div', 'shell');
    const header = element('header', 'topbar');
    const brand = element('div', 'brand', spec.project.name);
    const badge = element('span', 'badge', 'Prototype · dữ liệu giả');
    header.append(brand, badge);
    shell.append(header);
    const main = element('main', 'panel');
    main.append(element('h1', '', screen.title));
    if (notice) {
      const alert = element('p', 'notice', notice);
      alert.setAttribute('role', 'status');
      main.append(alert);
      notice = '';
    }
    const errorBox = element('p', 'error');
    errorBox.setAttribute('role', 'alert');
    const content = screen.pattern === 'form' ? element('form') : element('div');
    if (content.tagName === 'FORM') content.noValidate = false;
    for (const component of screen.components) {
      if (component.type === 'table') appendTable(content, screen, component);
      else if (['text-input', 'date-input'].includes(component.type)) appendInput(content, component);
      else if (['text', 'message', 'status'].includes(component.type)) content.append(element('p', '', component.label));
    }
    content.append(errorBox);
    const actions = element('div', 'actions');
    for (const action of screen.actions) {
      const button = element('button', 'primary', action.label);
      button.type = 'button';
      button.addEventListener('click', () => {
        if (action.behavior?.type === 'save-record') submit(screen, action, content, errorBox);
        else {
          const flow = blueprint.flows.find((entry) => entry.from === screen.id && entry.actionId === action.id);
          if (flow) navigate(flow.to);
        }
      });
      actions.append(button);
    }
    content.append(actions);
    main.append(content);
    shell.append(main);
    app.append(shell);
  }

  window.addEventListener('hashchange', render);
  render();
})();
