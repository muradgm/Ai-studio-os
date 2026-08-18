import { collectOutcomeEvidence } from '../modules/outcome-evidence/runtime.mjs';
import { analyzeOutcomes } from '../modules/analytics/runtime.mjs';
import { synthesizeFeedback } from '../modules/feedback/runtime.mjs';
import { reviewPostLaunch } from '../modules/post-launch/runtime.mjs';
import { analyzeBenchmarkHistory } from '../modules/benchmark-history/runtime.mjs';
import { evaluateLearningPromotion } from '../modules/learning-promotion/runtime.mjs';

export function runObservationRuntime(input = {}) {
  const evidence = collectOutcomeEvidence({ launch: input.launch, metrics: input.metrics, experiment: input.experiment });
  const analytics = analyzeOutcomes({ evidence });
  const feedback = synthesizeFeedback({ entries: input.feedback });
  const postLaunch = reviewPostLaunch({ analytics, feedback });
  const benchmarkHistory = analyzeBenchmarkHistory({ runs: input.benchmarkRuns });
  const learningPromotion = evaluateLearningPromotion({ candidates: input.learningCandidates, analytics, feedback, postLaunch });
  const pass = evidence.pass && feedback.pass && benchmarkHistory.pass && learningPromotion.pass && postLaunch.outcomeStatus !== 'regression';
  return { stages: ['outcome-evidence','analytics','feedback','post-launch-review','benchmark-history','learning-promotion'], evidence, analytics, feedback, postLaunch, benchmarkHistory, learningPromotion, decisionReady: postLaunch.decisionReady, pass };
}

export function validateObservationBenchmark(output, expected = {}) {
  const failures = [];
  for (const stage of expected.requiredStages ?? []) if (!output.stages.includes(stage)) failures.push(`missing stage ${stage}`);
  if (expected.outcomeStatus && output.postLaunch.outcomeStatus !== expected.outcomeStatus) failures.push(`expected outcome ${expected.outcomeStatus}, got ${output.postLaunch.outcomeStatus}`);
  for (const id of expected.promotedRuleIds ?? []) if (!output.learningPromotion.promoted.includes(id)) failures.push(`expected promoted rule ${id}`);
  for (const id of expected.heldRuleIds ?? []) if (!output.learningPromotion.held.includes(id)) failures.push(`expected held rule ${id}`);
  for (const id of expected.rejectedRuleIds ?? []) if (!output.learningPromotion.rejected.includes(id)) failures.push(`expected rejected rule ${id}`);
  if (expected.requireNoActiveBenchmarkRegressions && output.benchmarkHistory.activeRegressions.length) failures.push('active benchmark regression detected');
  if (expected.requireNoBenchmarkRegressions && output.benchmarkHistory.regressions.length) failures.push('benchmark regression detected');
  if (expected.attribution && output.postLaunch.attribution !== expected.attribution) failures.push(`expected attribution ${expected.attribution}, got ${output.postLaunch.attribution}`);
  if (expected.runtimePass === true && output.pass !== true) failures.push('expected observation runtime to pass');
  if (expected.decisionReady === true && output.decisionReady !== true) failures.push('expected observation decision to be ready');
  return { pass: failures.length === 0, failures };
}
