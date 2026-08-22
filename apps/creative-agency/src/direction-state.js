export const directionCandidates = [
  {
    id: 'the-counter',
    label: 'The Counter',
    premise: 'A working service counter where product, staff attention, and practical choices share one horizontal field.',
    spatialModel: 'Continuous counter surface with zones for arrival, choice, preparation, and handoff.',
    typography: 'Warm editorial display paired with direct utility labels.',
    interaction: 'Hover and focus behave like staff attention moving toward the selected item.',
    mobile: 'Single-hand service path with immediate choice and route/shop utility.',
    risk: 'Can become too literal if the counter metaphor overwhelms product clarity.'
  },
  {
    id: 'the-conversation',
    label: 'The Conversation',
    premise: 'A quiet exchange between visitor and patisserie, organized as prompts, responses, and refined recommendations.',
    spatialModel: 'Alternating conversational panels that narrow from mood to product decision.',
    typography: 'Expressive sentence-scale headlines with restrained supporting type.',
    interaction: 'Selections feel like replies, not menu clicks.',
    mobile: 'Guided conversational stack with fast exits to visit, order, and contact.',
    risk: 'Can feel slow if practical conversion paths are hidden behind too much ceremony.'
  },
  {
    id: 'the-handoff',
    label: 'The Handoff',
    premise: 'The site builds toward the moment a prepared item is handed to the customer.',
    spatialModel: 'Layered preparation stages resolving into one clear final action.',
    typography: 'Measured, cinematic pacing with sharp transactional clarity at the end.',
    interaction: 'Progressive reveals track preparation, packaging, and delivery.',
    mobile: 'Compact sequence of preparation cards ending in immediate action.',
    risk: 'Can become overly cinematic unless each layer earns a useful decision.'
  }
];

export function createDirectionSelectionState({ candidates = directionCandidates, selectedId = null } = {}) {
  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? null;
  return {
    status: selected ? 'locked' : 'selection-required',
    candidates,
    selectedId: selected?.id ?? null,
    selected,
    canExecute: Boolean(selected),
    nextLayer: selected ? 'typography-layout-motion' : 'human-direction-selection'
  };
}

