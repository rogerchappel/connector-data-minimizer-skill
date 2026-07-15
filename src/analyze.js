const DEFAULT_POLICY = {
  allowedFields: [],
  sensitiveFields: [],
  blockedFields: [],
  manualReviewApprovals: []
};

export function analyzeAction(action, policy = {}) {
  validateAction(action);
  const normalizedPolicy = { ...DEFAULT_POLICY, ...policy };
  const required = unique(action.requiredFields);
  const optional = unique(action.optionalFields ?? []);
  const requested = unique(action.requestedFields);
  const needed = new Set([...required, ...optional]);
  const allowed = new Set(normalizedPolicy.allowedFields ?? []);
  const sensitive = new Set(normalizedPolicy.sensitiveFields ?? []);
  const blocked = new Set(normalizedPolicy.blockedFields ?? []);
  const manualReviewApprovals = new Set(normalizedPolicy.manualReviewApprovals ?? []);

  const missingRequired = required.filter((field) => !requested.includes(field));
  const extraFields = requested.filter((field) => !needed.has(field));
  const disallowedFields = allowed.size === 0 ? [] : requested.filter((field) => !allowed.has(field));
  const sensitiveFields = requested.filter((field) => sensitive.has(field));
  const blockedFields = requested.filter((field) => blocked.has(field));
  const manualReview = manualReviewApprovals.has(action.approval) || manualReviewApprovals.has(action.destination);

  const recommendation = chooseRecommendation({
    missingRequired,
    disallowedFields,
    blockedFields,
    sensitiveFields,
    extraFields,
    manualReview
  });

  return {
    connector: action.connector,
    operation: action.operation,
    destination: action.destination ?? 'unspecified',
    approval: action.approval ?? 'unspecified',
    minimalFields: required,
    optionalFields: optional.filter((field) => requested.includes(field)),
    requestedFields: requested,
    extraFields,
    missingRequired,
    disallowedFields,
    sensitiveFields,
    blockedFields,
    manualReview,
    recommendation,
    unsafe: recommendation !== 'pass'
  };
}

export function validateAction(action) {
  if (!action || typeof action !== 'object') {
    throw new Error('action fixture must be an object');
  }
  for (const key of ['connector', 'operation', 'requiredFields', 'requestedFields']) {
    if (!(key in action)) {
      throw new Error(`action fixture missing ${key}`);
    }
  }
  for (const key of ['requiredFields', 'requestedFields']) {
    if (!Array.isArray(action[key])) {
      throw new Error(`${key} must be an array`);
    }
  }
}

function chooseRecommendation(findings) {
  if (findings.missingRequired.length > 0 || findings.blockedFields.length > 0 || findings.disallowedFields.length > 0) {
    return 'block';
  }
  if (findings.sensitiveFields.length > 0 || findings.extraFields.length > 0 || findings.manualReview) {
    return 'review';
  }
  return 'pass';
}

function unique(values) {
  return [...new Set((values ?? []).map((value) => String(value).trim()).filter(Boolean))];
}

