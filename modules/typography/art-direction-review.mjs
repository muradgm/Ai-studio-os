function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function systemId(system) {
  const parts = [system?.display?.font?.family, system?.body?.font?.family, system?.utility?.font?.family]
    .filter(Boolean)
    .map((value)=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
  return `type-system:${parts.join('+')}`;
}

export function attachTypographySystemIds(systems = []) {
  return systems.map((system)=>({ ...system, systemId:systemId(system) }));
}

export function resolveTypographyArtDirection({ systems = [], intent = null, review = null, required = false } = {}) {
  const identified = attachTypographySystemIds(systems);
  const mustReview = required === true || intent?.authority === 'selected-creative-world' || intent?.authority === 'typography-art-direction';

  if (!identified.length) {
    return { stage:'typography-art-direction', schema:'ai-studio-os/typography-art-direction-review@1', required:mustReview, pass:false, approved:false, findings:[{severity:'blocker',code:'typography-art-direction-systems-missing'}], systems:identified, selectedSystemId:null, selected:null };
  }

  if (!mustReview && !review) {
    return {
      stage:'typography-art-direction', schema:'ai-studio-os/typography-art-direction-review@1', required:false,
      pass:true, approved:true, mode:'algorithmic-default', findings:[], systems:identified,
      selectedSystemId:identified[0].systemId, selected:identified[0], rationale:'No reviewed Creative World or explicit art-direction override requires a manual selection gate.'
    };
  }

  if (!review || typeof review !== 'object' || Array.isArray(review)) {
    return {
      stage:'typography-art-direction', schema:'ai-studio-os/typography-art-direction-review@1', required:true,
      pass:false, approved:false, mode:'review-required', systems:identified, selectedSystemId:null, selected:null,
      findings:[{severity:'blocker',code:'typography-art-direction-review-required'}]
    };
  }

  const findings = [];
  if (review.schema && review.schema !== 'ai-studio-os/typography-art-direction-review@1') findings.push({severity:'blocker',code:'typography-art-direction-review-schema-unsupported'});
  if (review.reviewReady !== true || review.approved !== true) findings.push({severity:'blocker',code:'typography-art-direction-review-not-approved'});
  const selectedSystemId = clean(review.selectedSystemId);
  const selected = identified.find((system)=>system.systemId === selectedSystemId) ?? null;
  if (!selected) findings.push({severity:'blocker',code:'typography-art-direction-selected-system-invalid',selectedSystemId:selectedSystemId || null});
  const rationale = clean(review.rationale);
  if (!rationale) findings.push({severity:'blocker',code:'typography-art-direction-rationale-required'});

  return {
    stage:'typography-art-direction', schema:'ai-studio-os/typography-art-direction-review@1', required:true,
    pass:!findings.some((item)=>item.severity === 'blocker'), approved:findings.length === 0,
    mode:'reviewed-selection', systems:identified, selectedSystemId:selected?.systemId ?? selectedSystemId || null,
    selected, rationale:rationale || null,
    reviewer:clean(review.reviewer) || null,
    findings
  };
}
