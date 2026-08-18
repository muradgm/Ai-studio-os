import { buildStoryboard } from '../modules/storyboard/runtime.mjs';
import { buildContinuityPlan } from '../modules/continuity/runtime.mjs';
import { buildVideoPlan } from '../modules/video/runtime.mjs';
import { buildVoicePlan } from '../modules/voice/runtime.mjs';
import { buildAudioPlan } from '../modules/audio/runtime.mjs';
import { reviewMultimodal } from '../modules/multimodal-evals/runtime.mjs';
export function runMultimodalRuntime(input) {
  const direction = input.creativeDirection; if (!direction?.directionStatement) throw new Error('multimodal runtime requires creativeDirection');
  const storyboard = buildStoryboard({ direction, intent: input.intent, durationSec: input.durationSec, beats: input.beats, shots: input.shots });
  const continuity = buildContinuityPlan({ direction, bible: input.continuityBible, shots: storyboard.shots });
  const video = buildVideoPlan({ direction, storyboard, formats: input.formats, formatPlans: input.formatPlans });
  const beatIds = storyboard.beats.map((b) => b.id);
  const voice = buildVoicePlan({ direction, ...input.voice, beats: storyboard.beats });
  const audio = buildAudioPlan({ direction, beatIds, voice, ...input.audio });
  const review = reviewMultimodal({ direction, storyboard, continuity, video, voice, audio, targetDurationSec: input.durationSec });
  return { id: input.id, taskType: input.taskType, stages: ['storyboard','continuity','video','voice','audio','multimodal-review'], status: review.pass ? 'ready' : 'blocked', creativeDirection: direction, storyboard, continuity, video, voice, audio, review };
}
export function validateMultimodalBenchmark(output, expected) {
  const failures = [];
  for (const stage of expected.requiredStages ?? []) if (!output.stages.includes(stage)) failures.push(`missing stage: ${stage}`);
  if (expected.requireSharedDirection) for (const key of ['storyboard','continuity','video','voice','audio']) if (output[key].directionContext?.statement !== output.creativeDirection.directionStatement) failures.push(`${key}: direction drift`);
  if (Number.isFinite(Number(expected.durationSec)) && output.video.durationSec !== Number(expected.durationSec)) failures.push(`duration: expected ${expected.durationSec}, got ${output.video.durationSec}`);
  for (const format of expected.requiredFormats ?? []) if (!output.video.formats.includes(format)) failures.push(`missing format: ${format}`);
  if (expected.voiceEnabled !== undefined && output.voice.enabled !== expected.voiceEnabled) failures.push('voice enabled mismatch');
  if (expected.requireCaptions && output.audio.accessibility?.captions !== true) failures.push('captions missing');
  if (expected.requireTranscript && output.audio.accessibility?.transcript !== true) failures.push('transcript missing');
  if (expected.requireClearedMusic && !['cleared','original','royalty-cleared'].includes(output.audio.music?.licenseStatus)) failures.push('music rights unresolved');
  if (expected.reviewPass !== undefined && output.review.pass !== expected.reviewPass) failures.push(`review pass mismatch: ${output.review.pass}`);
  return { pass: failures.length === 0, failures };
}
