const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const ids = (items) => new Set(items.map((item) => item.id));

export function validateRun(spec, blueprint) {
  const errors = [];
  const warnings = [];
  const add = (list, code, message, path = '') => list.push({ code, message, path });
  const requiredArray = (owner, key, path) => {
    if (!Array.isArray(owner?.[key])) {
      add(errors, 'SHAPE', `${key} must be an array`, path);
      return [];
    }
    return owner[key];
  };

  if (!isObject(spec) || !isObject(blueprint)) {
    add(errors, 'SHAPE', 'Spec and Blueprint must be JSON objects');
    return { errors, warnings, coverage: null };
  }
  if (spec.schemaVersion !== '0.1.0' || blueprint.schemaVersion !== '0.1.0')
    add(errors, 'VERSION', 'Both files must use schemaVersion 0.1.0');
  if (!spec.runId || spec.runId !== blueprint.runId)
    add(errors, 'RUN_ID', 'Spec and Blueprint must have the same nonempty runId');

  const sources = requiredArray(spec, 'sources', 'spec.sources');
  const actors = requiredArray(spec, 'actors', 'spec.actors');
  const requirements = requiredArray(spec, 'requirements', 'spec.requirements');
  const rules = requiredArray(spec, 'rules', 'spec.rules');
  const questions = requiredArray(spec, 'openQuestions', 'spec.openQuestions');
  const assumptions = requiredArray(spec, 'assumptions', 'spec.assumptions');
  const screens = requiredArray(blueprint, 'screens', 'blueprint.screens');
  const flows = requiredArray(blueprint, 'flows', 'blueprint.flows');
  const unmapped = requiredArray(blueprint, 'unmappedRequirements', 'blueprint.unmappedRequirements');

  for (const [name, list] of [['source', sources], ['actor', actors], ['requirement', requirements], ['rule', rules], ['screen', screens]]) {
    const seen = new Set();
    for (const item of list) {
      if (!item?.id || seen.has(item.id)) add(errors, 'DUPLICATE_ID', `${name} ID is missing or duplicated: ${item?.id ?? '(missing)'}`);
      seen.add(item?.id);
    }
  }

  const sourceIds = ids(sources);
  const actorIds = ids(actors);
  const requirementIds = ids(requirements);
  const ruleIds = ids(rules);
  const screenIds = ids(screens);
  const checkRefs = (values, known, path, kind) => {
    if (!Array.isArray(values)) {
      add(errors, 'SHAPE', `${kind} references must be an array`, path);
      return;
    }
    for (const value of values) if (!known.has(value)) add(errors, 'BROKEN_REF', `Unknown ${kind}: ${value}`, path);
  };
  const checkEvidence = (item, path) => {
    if (item.status === 'confirmed' && (!Array.isArray(item.evidence) || item.evidence.length === 0))
      add(errors, 'NO_EVIDENCE', 'Confirmed item requires evidence', path);
    for (const evidence of item.evidence ?? []) {
      if (!sourceIds.has(evidence.sourceId) || !evidence.locator)
        add(errors, 'BAD_EVIDENCE', 'Evidence needs a known sourceId and locator', path);
    }
  };

  for (const req of requirements) {
    checkRefs(req.actorIds, actorIds, `requirements.${req.id}`, 'actor');
    checkEvidence(req, `requirements.${req.id}`);
    if (req.status === 'conflicting' || req.status === 'unresolved')
      add(errors, 'SPEC_BLOCKED', `${req.id} is ${req.status}`, `requirements.${req.id}`);
  }
  for (const rule of rules) {
    checkRefs(rule.requirementIds, requirementIds, `rules.${rule.id}`, 'requirement');
    checkEvidence(rule, `rules.${rule.id}`);
    if (rule.status === 'conflicting' || rule.status === 'unresolved')
      add(errors, 'SPEC_BLOCKED', `${rule.id} is ${rule.status}`, `rules.${rule.id}`);
  }
  for (const question of questions) {
    checkRefs(question.relatedRequirementIds, requirementIds, `openQuestions.${question.id}`, 'requirement');
    if (question.blocking) add(errors, 'OPEN_BLOCKER', `Blocking question remains: ${question.id}`, `openQuestions.${question.id}`);
  }
  for (const assumption of assumptions) {
    checkRefs(assumption.relatedRequirementIds, requirementIds, `assumptions.${assumption.id}`, 'requirement');
    if (assumption.status === 'proposed') add(warnings, 'UNAPPROVED_ASSUMPTION', `${assumption.id} is still proposed`);
  }

  const mapped = new Set();
  const mark = (values, path) => {
    checkRefs(values, requirementIds, path, 'requirement');
    for (const id of values ?? []) mapped.add(id);
  };
  for (const screen of screens) {
    const path = `screens.${screen.id}`;
    mark(screen.requirementIds, path);
    checkRefs(screen.actorIds, actorIds, path, 'actor');
    if (!['list', 'form'].includes(screen.pattern))
      add(errors, 'UNSUPPORTED_PATTERN', `POC renderer supports list and form only: ${screen.pattern}`, path);
    if (screen.pattern === 'list' && !screen.dataSource?.collection)
      add(errors, 'DATA_SOURCE', 'List screen needs dataSource.collection', path);
    for (const component of screen.components ?? []) {
      mark(component.requirementIds, `${path}.components.${component.id}`);
      if (!['table', 'text-input', 'date-input', 'text', 'message', 'status', 'button'].includes(component.type))
        add(errors, 'UNSUPPORTED_COMPONENT', `POC renderer does not support ${component.type}`, `${path}.components.${component.id}`);
      if (component.type === 'table' && (!Array.isArray(component.columns) || component.columns.length === 0))
        add(errors, 'TABLE_COLUMNS', 'Table needs explicit columns', `${path}.components.${component.id}`);
      if (component.type === 'table' && screen.pattern !== 'list')
        add(errors, 'COMPONENT_PATTERN', 'Table is only supported on list screens', `${path}.components.${component.id}`);
      if (['text-input', 'date-input', 'select'].includes(component.type) && !component.field)
        add(errors, 'FORM_FIELD', 'Input needs field', `${path}.components.${component.id}`);
      if (['text-input', 'date-input'].includes(component.type) && screen.pattern !== 'form')
        add(errors, 'COMPONENT_PATTERN', 'Input is only supported on form screens', `${path}.components.${component.id}`);
    }
    const actionIds = new Set();
    for (const action of screen.actions ?? []) {
      if (!action.id || actionIds.has(action.id)) add(errors, 'DUPLICATE_ACTION', `Duplicate action in ${screen.id}: ${action.id}`);
      actionIds.add(action.id);
      mark(action.requirementIds, `${path}.actions.${action.id}`);
      checkRefs(action.ruleIds ?? [], ruleIds, `${path}.actions.${action.id}`, 'rule');
      const behavior = action.behavior ?? { type: 'navigate' };
      if (!['navigate', 'save-record'].includes(behavior.type))
        add(errors, 'BEHAVIOR', `Unsupported action behavior: ${behavior.type}`, path);
      if (behavior.type === 'save-record' && !behavior.collection)
        add(errors, 'BEHAVIOR', 'save-record needs collection', path);
      if (behavior.type === 'save-record' && screen.pattern !== 'form')
        add(errors, 'BEHAVIOR', 'save-record is only supported on form screens', path);
      if (behavior.type === 'save-record' && Object.keys(behavior.defaults ?? {}).length && !(action.ruleIds ?? []).length)
        add(errors, 'RULE_MAPPING', 'Saved default values need at least one linked rule', path);
      for (const [field, value] of Object.entries(behavior.defaults ?? {})) {
        const supportingRules = rules.filter((rule) => (action.ruleIds ?? []).includes(rule.id));
        if (!supportingRules.some((rule) => rule.statement.toLocaleLowerCase().includes(String(value).toLocaleLowerCase())))
          add(errors, 'UNSUPPORTED_DEFAULT', `Default ${field}=${value} has no matching statement in linked rules`, path);
      }
      if (behavior.type === 'navigate' && !flows.some((flow) => flow.from === screen.id && flow.actionId === action.id))
        add(errors, 'FLOW', `Navigate action ${action.id} needs a flow`, path);
      for (const validation of behavior.validations ?? []) {
        if (validation.type !== 'date-order' || !validation.startField || !validation.endField || !ruleIds.has(validation.ruleId))
          add(errors, 'VALIDATION', 'date-order needs known ruleId, startField and endField', path);
        if (!(action.ruleIds ?? []).includes(validation.ruleId))
          add(errors, 'RULE_MAPPING', `Validation rule ${validation.ruleId} must be linked to action ${action.id}`, path);
      }
    }
  }
  if (!screenIds.has(blueprint.navigation?.entryScreenId))
    add(errors, 'ENTRY', 'entryScreenId must point to a screen');
  for (const flow of flows) {
    mark(flow.requirementIds, `flows.${flow.from}.${flow.actionId}`);
    const source = screens.find((screen) => screen.id === flow.from);
    if (!source || !screenIds.has(flow.to)) add(errors, 'FLOW', `Flow has unknown screen: ${flow.from} → ${flow.to}`);
    if (source && !(source.actions ?? []).some((action) => action.id === flow.actionId))
      add(errors, 'FLOW', `Flow action ${flow.actionId} is missing from ${flow.from}`);
  }
  const unmappedIds = new Set();
  for (const item of unmapped) {
    if (!requirementIds.has(item.requirementId) || !item.reason) add(errors, 'UNMAPPED', 'Unmapped requirement needs known ID and reason');
    unmappedIds.add(item.requirementId);
    if (mapped.has(item.requirementId)) add(errors, 'UNMAPPED', `${item.requirementId} is both mapped and unmapped`);
  }
  const uiRequirements = requirements.filter((req) => req.uiRelevant);
  for (const req of uiRequirements) {
    if (!mapped.has(req.id) && !unmappedIds.has(req.id)) add(errors, 'MISSING_MAPPING', `${req.id} has no UI mapping or exclusion reason`);
    if (req.priority === 'must' && unmappedIds.has(req.id)) add(warnings, 'MUST_UNMAPPED', `${req.id} is must but unmapped`);
  }
  return {
    errors, warnings,
    coverage: {
      uiRequirementCount: uiRequirements.length,
      mappedCount: uiRequirements.filter((req) => mapped.has(req.id)).length,
      unmapped: [...unmappedIds]
    }
  };
}

export function makeTraceability(spec, blueprint) {
  return spec.requirements.map((requirement) => ({
    requirementId: requirement.id,
    statement: requirement.statement,
    screens: blueprint.screens.filter((screen) => screen.requirementIds.includes(requirement.id)).map((screen) => screen.id),
    flows: blueprint.flows.filter((flow) => flow.requirementIds.includes(requirement.id)).map((flow) => `${flow.from}:${flow.actionId}:${flow.to}`),
    unmappedReason: blueprint.unmappedRequirements.find((item) => item.requirementId === requirement.id)?.reason ?? null
  }));
}
