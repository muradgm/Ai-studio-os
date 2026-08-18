import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildStoryboard } from '../modules/storyboard/runtime.mjs';
import { buildContinuityPlan } from '../modules/continuity/runtime.mjs';
import { buildVideoPlan } from '../modules/video/runtime.mjs';
import { buildVoicePlan } from '../modules/voice/runtime.mjs';
import { buildAudioPlan } from '../modules/audio/runtime.mjs';
import { reviewMultimodal } from '../modules/multimodal-evals/runtime.mjs';
import { runMultimodalRuntime, validateMultimodalBenchmark } from '../lib/multimodal-runtime.mjs';

const input = JSON.parse(fs.readFileSync(new URL('../benchmarks/003-du-bonheur-brand-film/input.json', import.meta.url)));
const expected = JSON.parse(fs.readFileSync(new URL('../benchmarks/003-du-bonheur-brand-film/expected.json', import.meta.url)));

test('truth-sensitive real product cannot route to synthetic documentary imagery', () => {
  const bad = structuredClone(input);
  bad.shots[0].sourcePolicy = 'generate-synthetic';
  const board = buildStoryboard({ direction: bad.creativeDirection, intent: bad.intent, durationSec: bad.durationSec, beats: bad.beats, shots: bad.shots });
  assert.equal(board.pass, false);
  assert.ok(board.findings.some(f => f.code === 'truth-sensitive-synthetic-source'));
});

test('continuity bible blocks locked-value drift', () => {
  const badShots = structuredClone(input.shots);
  badShots[2].continuity.grade = 'high-contrast-cool';
  const plan = buildContinuityPlan({ direction: input.creativeDirection, bible: input.continuityBible, shots: badShots });
  assert.equal(plan.pass, false);
  assert.ok(plan.findings.some(f => f.code === 'locked-continuity-drift'));
});

test('vertical output requires explicit safe-area strategy', () => {
  const board = buildStoryboard({ direction: input.creativeDirection, intent: input.intent, durationSec: input.durationSec, beats: input.beats, shots: input.shots });
  const video = buildVideoPlan({ direction: input.creativeDirection, storyboard: board, formats: ['16:9','9:16'], formatPlans: {'16:9': {}} });
  assert.equal(video.pass, false);
  assert.ok(video.findings.some(f => f.code === 'vertical-safe-area-missing'));
});

test('voice lines must target real storyboard beats', () => {
  const voice = buildVoicePlan({ direction: input.creativeDirection, ...input.voice, beats: input.beats, lines: [{beatId:'missing', text:'No.', durationSec:1}] });
  assert.equal(voice.pass, false);
});

test('spoken content requires captions and transcript', () => {
  const voice = buildVoicePlan({ direction: input.creativeDirection, ...input.voice, beats: input.beats });
  const audio = buildAudioPlan({ direction: input.creativeDirection, beatIds: input.beats.map(b => b.id), voice, music: input.audio.music, soundDesign: input.audio.soundDesign, accessibility: { captions: false, transcript: true } });
  assert.equal(audio.pass, false);
  assert.ok(audio.findings.some(f => f.code === 'captions-required'));
});

test('commercial music without rights evidence is blocked', () => {
  const voice = buildVoicePlan({ direction: input.creativeDirection, ...input.voice, beats: input.beats });
  const audio = buildAudioPlan({ direction: input.creativeDirection, beatIds: input.beats.map(b => b.id), voice, music: {...input.audio.music, licenseStatus:'unknown'}, soundDesign: [], accessibility: input.audio.accessibility });
  assert.equal(audio.pass, false);
  assert.ok(audio.findings.some(f => f.code === 'music-rights-unresolved'));
});

test('cross-modal review blocks creative-direction drift', () => {
  const output = runMultimodalRuntime(input);
  const driftedAudio = structuredClone(output.audio);
  driftedAudio.directionContext.statement = 'Different creative direction';
  const review = reviewMultimodal({ direction: input.creativeDirection, storyboard: output.storyboard, continuity: output.continuity, video: output.video, voice: output.voice, audio: driftedAudio, targetDurationSec: input.durationSec });
  assert.equal(review.pass, false);
  assert.ok(review.findings.some(f => f.code === 'creative-direction-drift' && f.stage === 'audio'));
});

test('voice density above 65 percent of film duration requires revision', () => {
  const output = runMultimodalRuntime(input);
  const denseVoice = {...output.voice, estimatedDurationSec: 22};
  const review = reviewMultimodal({ direction: input.creativeDirection, storyboard: output.storyboard, continuity: output.continuity, video: output.video, voice: denseVoice, audio: output.audio, targetDurationSec: 30 });
  assert.equal(review.pass, false);
  assert.ok(review.findings.some(f => f.code === 'voice-density-too-high'));
});

test('real-source truth-sensitive shot requires source evidence', () => {
  const bad = structuredClone(input);
  delete bad.shots[0].sourceEvidence;
  const board = buildStoryboard({ direction: bad.creativeDirection, intent: bad.intent, durationSec: bad.durationSec, beats: bad.beats, shots: bad.shots });
  assert.equal(board.pass, false);
  assert.ok(board.findings.some(f => f.code === 'truth-source-evidence-missing'));
});

test('beat timing must equal shot timing within each beat', () => {
  const bad = structuredClone(input);
  bad.shots[1].durationSec = 2.5;
  bad.shots[2].durationSec = 4.5;
  const board = buildStoryboard({ direction: bad.creativeDirection, intent: bad.intent, durationSec: bad.durationSec, beats: bad.beats, shots: bad.shots });
  assert.equal(board.pass, true);
  bad.shots[2].beatId = 'texture';
  const broken = buildStoryboard({ direction: bad.creativeDirection, intent: bad.intent, durationSec: bad.durationSec, beats: bad.beats, shots: bad.shots });
  assert.equal(broken.pass, false);
  assert.ok(broken.findings.some(f => f.code === 'shot-beat-duration-mismatch'));
});

test('voice usage rights are required', () => {
  const badVoice = structuredClone(input.voice);
  badVoice.usageRightsEvidence = '   ';
  const voice = buildVoicePlan({ direction: input.creativeDirection, ...badVoice, beats: input.beats });
  assert.equal(voice.pass, false);
  assert.ok(voice.findings.some(f => f.code === 'voice-usage-rights-missing'));
});

test('voice clone specifically requires consent evidence', () => {
  const cloned = { ...input.voice, sourceType: 'voice-clone', consentEvidence: '' };
  const voice = buildVoicePlan({ direction: input.creativeDirection, ...cloned, beats: input.beats });
  assert.equal(voice.pass, false);
  assert.ok(voice.findings.some(f => f.code === 'voice-clone-consent-missing'));
});

test('music status without rights evidence is insufficient', () => {
  const voice = buildVoicePlan({ direction: input.creativeDirection, ...input.voice, beats: input.beats });
  const audio = buildAudioPlan({ direction: input.creativeDirection, beatIds: input.beats.map(b => b.id), voice, music: {...input.audio.music, rightsEvidence:' '}, soundDesign: input.audio.soundDesign, accessibility: input.audio.accessibility });
  assert.equal(audio.pass, false);
  assert.ok(audio.findings.some(f => f.code === 'music-rights-evidence-missing'));
});

test('Du Bonheur multimodal benchmark passes all invariants', () => {
  const output = runMultimodalRuntime(input);
  const result = validateMultimodalBenchmark(output, expected);
  assert.equal(result.pass, true, result.failures.join('\n'));
  assert.equal(output.review.pass, true);
  assert.equal(output.video.durationSec, 30);
  assert.equal(output.audio.music.licenseStatus, 'original');
});

test('product-film route invokes storyboard, continuity, voice, audio, video, and multimodal review', () => {
  const routes = JSON.parse(fs.readFileSync(new URL('../kernel/routes.json', import.meta.url)));
  for (const stage of ['storyboard','continuity','voice','audio','video','multimodal-review']) assert.ok(routes['product-film'].includes(stage), stage);
});

test('multimodal council includes continuity and skeptic roles', () => {
  const council = JSON.parse(fs.readFileSync(new URL('../kernel/councils/multimodal.json', import.meta.url)));
  assert.ok(council.members.includes('continuity-supervisor'));
  assert.ok(council.members.includes('skeptic'));
});

test('invalid target duration is a blocker', () => {
  const bad = structuredClone(input);
  bad.durationSec = 'not-a-number';
  const output = runMultimodalRuntime(bad);
  assert.equal(output.review.pass, false);
  assert.ok(output.review.findings.some(f => f.code === 'invalid-target-duration'));
});

test('continuity bible cannot be empty', () => {
  const plan = buildContinuityPlan({ direction: input.creativeDirection, bible: {}, shots: input.shots });
  assert.equal(plan.pass, false);
  assert.ok(plan.findings.some(f => f.code === 'continuity-bible-empty'));
});

test('video plan requires at least one output format', () => {
  const board = buildStoryboard({ direction: input.creativeDirection, intent: input.intent, durationSec: input.durationSec, beats: input.beats, shots: input.shots });
  const video = buildVideoPlan({ direction: input.creativeDirection, storyboard: board, formats: [], formatPlans: {} });
  assert.equal(video.pass, false);
  assert.ok(video.findings.some(f => f.code === 'video-format-missing'));
});

test('enabled voice requires valid source type and actual spoken lines', () => {
  const voice = buildVoicePlan({ direction: input.creativeDirection, ...input.voice, sourceType: 'unknown', lines: [], beats: input.beats });
  assert.equal(voice.pass, false);
  assert.ok(voice.findings.some(f => f.code === 'voice-source-type-invalid'));
  assert.ok(voice.findings.some(f => f.code === 'voice-lines-missing'));
});
