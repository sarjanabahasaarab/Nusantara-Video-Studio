/**
 * Nusantara Video Studio - CLI Automated Test Runner
 * Phase 6: Professional Color & Audio Studio
 *
 * Runs headless tests verifying:
 * 1. Color Engine (Curves, Wheels, Presets, Pixels)
 * 2. LUT Parser (Validation, Parsing, Interpolation)
 * 3. Video Scope Engine (Histogram, Waveform, Vectorscope)
 * 4. Audio Processing Engine (dB conversion, Parametric EQ, Compressor, Limiter, Normalization)
 * 5. Project Persistence (.nvproj serialization & backward compatibility)
 */

import { ColorEngine } from '../engine/color/ColorEngine';
import { LUTParser } from '../engine/color/LUTParser';
import { ScopeEngine } from '../engine/color/ScopeEngine';
import { AudioProcessingEngine } from '../engine/audio/AudioProcessingEngine';
import { KeyframeEngine } from '../engine/keyframes/KeyframeEngine';
import { fileService } from '../services/fileService';

import { RenderCapabilitiesService } from '../render/RenderCapabilities';
import { RenderSettingsManager } from '../render/RenderSettings';
import { RenderPresetManager } from '../render/RenderPreset';
import { HardwareAccelerationManager } from '../render/HardwareAcceleration';
import { FrameRenderer } from '../render/FrameRenderer';
import { AudioRenderer } from '../render/AudioRenderer';
import { FFmpegAdapter } from '../render/adapters/FFmpegAdapter';
import { RenderValidator } from '../render/RenderValidator';
import { RenderEngine } from '../render/RenderEngine';
import { ExportManager } from '../render/ExportManager';
import { RenderQueueManager } from '../render/RenderQueue';
import { RenderJobInstance } from '../render/RenderJob';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}${detail ? ` (${detail})` : ''}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
  }
}

console.log('\n======================================================');
console.log(' NUSANTARA VIDEO STUDIO - PHASE 6 TEST SUITE');
console.log(' Professional Color & Audio Studio Verification');
console.log('======================================================\n');

// ------------------------------------------------------------------
// 1. COLOR ENGINE TESTS
// ------------------------------------------------------------------
console.log('[SECTION 1: COLOR PROCESSING ENGINE]');

const defaultGrading = ColorEngine.getDefaultColorGrading();
assert(
  defaultGrading.enabled === true &&
    defaultGrading.basic.exposure === 0 &&
    defaultGrading.basic.contrast === 0 &&
    defaultGrading.basic.saturation === 0,
  'Default Color Grading Object Structure'
);

// Spline Curve
const curvePoints = [
  { x: 0, y: 0 },
  { x: 64, y: 40 },
  { x: 192, y: 220 },
  { x: 255, y: 255 },
];
const y0 = ColorEngine.evaluateCurve(curvePoints, 0);
const y128 = ColorEngine.evaluateCurve(curvePoints, 128);
const y255 = ColorEngine.evaluateCurve(curvePoints, 255);
assert(y0 === 0 && y255 === 255 && y128 > 40 && y128 < 220, 'Cubic Spline Curve Interpolation', `X=128 => Y=${y128}`);

// Color Wheels
const [liftR, liftG, liftB] = ColorEngine.colorWheelToRGB({ hue: 0, saturation: 50, luminance: 10 });
assert(liftR > liftG && liftR > liftB, 'Color Wheel Hue 0° Boosts Red', `R:${liftR.toFixed(2)} G:${liftG.toFixed(2)} B:${liftB.toFixed(2)}`);

// Presets
const presets = ColorEngine.getBuiltinPresets();
assert(presets.length >= 8, '8 Built-in Cinematic Presets Availability', `Found ${presets.length} presets`);

// Pixel Buffer Processing
const fakeImg = {
  data: new Uint8ClampedArray([100, 100, 100, 255, 150, 150, 150, 255]),
  width: 2,
  height: 1,
  colorSpace: 'srgb',
} as unknown as ImageData;
ColorEngine.processPixels(fakeImg, {
  ...defaultGrading,
  basic: { ...defaultGrading.basic, exposure: 40 },
});
assert(fakeImg.data[0] > 100, 'Pixel Buffer Direct Exposure Scaling', `100 -> ${fakeImg.data[0]}`);

// ------------------------------------------------------------------
// 2. LUT PARSER TESTS
// ------------------------------------------------------------------
console.log('\n[SECTION 2: .CUBE LUT ENGINE]');

const cubeContent = `# Test LUT
TITLE "Test3DLUT"
LUT_3D_SIZE 2
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0
`;
const parseRes = LUTParser.parseCubeText(cubeContent, 'Test');
assert(parseRes.valid === true && parseRes.lut?.size === 2, 'Valid 3D .cube File Parser', `Size=${parseRes.lut?.size}`);

const invalidCube = `TITLE "Invalid"
LUT_3D_SIZE 4
0.0 0.0 0.0
`;
const corruptRes = LUTParser.parseCubeText(invalidCube, 'Invalid');
assert(corruptRes.valid === false && !!corruptRes.error, 'Invalid/Truncated .cube File Rejection', corruptRes.error);

if (parseRes.lut) {
  const [tr, tg, tb] = LUTParser.apply3DLUT(0.5, 0.5, 0.5, parseRes.lut, 1.0);
  assert(isFinite(tr) && isFinite(tg) && isFinite(tb), 'Trilinear Interpolation Evaluation', `RGB: ${tr.toFixed(2)}, ${tg.toFixed(2)}, ${tb.toFixed(2)}`);
}

// ------------------------------------------------------------------
// 3. VIDEO SCOPES TESTS
// ------------------------------------------------------------------
console.log('\n[SECTION 3: REAL-TIME VIDEO SCOPES]');

const testScopeFrame = {
  data: new Uint8ClampedArray(16 * 16 * 4).fill(128),
  width: 16,
  height: 16,
  colorSpace: 'srgb',
} as unknown as ImageData;

const hist = ScopeEngine.computeHistogram(testScopeFrame, 1);
assert(hist.luma[128] === 256, 'Histogram 256-bin Distribution Count', `Bin 128 has ${hist.luma[128]} pixels`);

const wf = ScopeEngine.computeWaveform(testScopeFrame, 16);
assert(wf.width === 16 && wf.height === 256, 'Column Waveform Density Grid', `${wf.width}x${wf.height}`);

const vec = ScopeEngine.computeVectorscope(testScopeFrame, 1);
assert(vec.scatterGrid.length === 256 * 256, 'Vectorscope Chrominance Scatter Matrix', `Grid size: ${vec.scatterGrid.length}`);

// ------------------------------------------------------------------
// 4. AUDIO PROCESSING ENGINE TESTS
// ------------------------------------------------------------------
console.log('\n[SECTION 4: AUDIO PROCESSING ENGINE & DSP]');

const lin0 = AudioProcessingEngine.dbToLinear(0);
const lin6 = AudioProcessingEngine.dbToLinear(6);
const linMinus60 = AudioProcessingEngine.dbToLinear(-60);
const db1 = AudioProcessingEngine.linearToDb(1.0);
assert(
  Math.abs(lin0 - 1.0) < 0.001 &&
    Math.abs(lin6 - 1.995) < 0.05 &&
    linMinus60 === 0 &&
    Math.abs(db1 - 0) < 0.001,
  'Decibel <-> Linear Amplitude Conversions',
  `0dB=${lin0}, +6dB=${lin6.toFixed(2)}, -60dB=${linMinus60}`
);

const defaultEQ = AudioProcessingEngine.getDefaultEQ();
assert(defaultEQ.bands.length === 5, '5-Band Parametric Equalizer Bands', `${defaultEQ.bands.map((b) => b.name).join(', ')}`);

const defaultComp = AudioProcessingEngine.getDefaultCompressor();
assert(defaultComp.threshold === -18 && defaultComp.ratio === 3.5, 'Dynamics Compressor Default Parameters', `Threshold ${defaultComp.threshold}dB, Ratio ${defaultComp.ratio}:1`);

const defaultLimiter = AudioProcessingEngine.getDefaultLimiter();
assert(defaultLimiter.ceiling === -0.1, 'Anti-Clipping Master Limiter Ceiling', `${defaultLimiter.ceiling} dB True Peak`);

const norm = AudioProcessingEngine.calculatePeakNormalization(-6.0, -0.1);
assert(Math.abs(norm - 5.9) < 0.01, 'Peak Normalization Gain Calculation', `-6.0 dB -> +${norm.toFixed(1)} dB`);

// ------------------------------------------------------------------
// 5. AUTOMATION & PROJECT PERSISTENCE
// ------------------------------------------------------------------
console.log('\n[SECTION 5: KEYFRAMING & PROJECT PERSISTENCE]');

const animExposure = {
  property: 'exposure',
  keyframes: [
    { id: 'kf-1', time: 0, value: -20, interpolation: 'ease-out' as const },
    { id: 'kf-2', time: 5, value: 30, interpolation: 'linear' as const },
  ],
};
const val0 = KeyframeEngine.evaluate(animExposure, 0, 0);
const val2_5 = KeyframeEngine.evaluate(animExposure, 2.5, 0);
const val5 = KeyframeEngine.evaluate(animExposure, 5, 0);
assert(val0 === -20 && val5 === 30 && val2_5 > -20 && val2_5 < 30, 'Keyframe Engine Color Parameter Interpolation', `t=0: ${val0}, t=2.5s: ${val2_5.toFixed(1)}, t=5s: ${val5}`);

const sampleProject: any = {
  projectVersion: 5,
  id: 'proj-p6-test',
  name: 'Phase 6 Test Project',
  createdAt: new Date().toISOString(),
  settings: { width: 1920, height: 1080, fps: 30, aspectRatio: '16:9', duration: 60, sampleRate: 48000 },
  media: [],
  timeline: {
    tracks: [
      {
        id: 'track-v1',
        name: 'V1',
        type: 'video',
        clips: [
          {
            id: 'c1',
            trackId: 'track-v1',
            name: 'Clip 1',
            type: 'video',
            startTime: 0,
            duration: 10,
            colorGrading: defaultGrading,
          },
        ],
      },
    ],
    duration: 60,
  },
};
const serializedProj = fileService.serializeProject(sampleProject);
const parsedProj = fileService.parseProject(serializedProj);
assert(parsedProj.valid === true && parsedProj.project?.projectVersion === 5, 'Project Serialization .nvproj v5 Schema');

// ------------------------------------------------------------------
// 6. PHASE 7 AI-ASSISTED EDITING TESTS
// ------------------------------------------------------------------
console.log('\n[SECTION 6: PHASE 7 AI ENGINE & SMART EDITING]');

// Provider Registry & Local Capabilities
const { ProviderRegistry } = await import('../ai/providers/ProviderRegistry');
const { LocalAIProvider } = await import('../ai/providers/LocalAIProvider');
const { CloudAIProvider } = await import('../ai/providers/CloudAIProvider');
const { AIJobFactory } = await import('../ai/AIJob');
const { AIJobQueue } = await import('../ai/AIJobQueue');
const { SceneDetector } = await import('../ai/capabilities/sceneDetection');
const { SilenceDetector } = await import('../ai/capabilities/silenceDetection');
const { SmartReframeEngine } = await import('../ai/capabilities/smartReframe');
const { AudioCleanupEngine } = await import('../ai/capabilities/audioCleanup');
const { TranscriptionEngine } = await import('../ai/capabilities/transcription');
const { AIEngine } = await import('../ai/AIEngine');

const registry = ProviderRegistry.getInstance();
const localProvider = registry.getProvider('local-ai-provider');
const isLocalAvail = await localProvider?.isAvailable();
const localCaps = await localProvider?.getCapabilities();
assert(
  localProvider !== undefined && isLocalAvail === true && (localCaps?.length || 0) >= 4,
  'Local AI Provider Registration & Capabilities Discovery',
  `Found: ${localCaps?.join(', ')}`
);

// Privacy Enforcement Guard
const cloudProvider = new CloudAIProvider();
let privacyBlocked = false;
try {
  const dummyJob = AIJobFactory.createJob('transcription', ['test-media']);
  await cloudProvider.execute(dummyJob);
} catch (err: any) {
  if (err.message.includes('Cloud Processing Blocked')) {
    privacyBlocked = true;
  }
}
assert(privacyBlocked === true, 'Strict Cloud Privacy Guard (Blocks execution when consent is OFF)');

// Background AI Job Queue
const queue = AIJobQueue.getInstance();
const testJob = AIJobFactory.createJob('smart-reframe', ['clip-1'], { targetAspectRatio: '9:16' });
queue.enqueue(testJob);
assert(queue.getJob(testJob.id) !== undefined, 'AI Job Queue Asynchronous Enqueue Lifecycle');

// Frame Difference Metric Math
const frameA = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255]);
const frameB = new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 255]);
const diffSame = SceneDetector.calculateFrameDifference(frameA, frameA);
const diffDiff = SceneDetector.calculateFrameDifference(frameA, frameB);
assert(diffSame === 0 && diffDiff > 0.99, 'Visual Frame Difference Metric Math (0.0 to 1.0)');

// Scene Cut Sequence Extraction
const mockSamples = [
  { time: 0.0, pixels: frameA },
  { time: 1.0, pixels: frameA },
  { time: 2.0, pixels: frameB },
  { time: 3.0, pixels: frameB },
  { time: 4.0, pixels: frameA },
];
const detectedScenes = SceneDetector.detectScenesFromDeltas(mockSamples, 5.0, { threshold: 0.25, minSceneDuration: 0.5 });
assert(
  detectedScenes.length === 3 && detectedScenes[1].start === 2.0 && detectedScenes[2].start === 4.0,
  'Visual Scene Detection Cut Point Identification',
  `Cut points: ${detectedScenes.map((s) => `${s.start}s`).join(', ')}`
);

// Audio RMS Silence Detection
const sampleRate = 8000;
const pcmBuffer = new Float32Array(sampleRate * 3);
// 0s-1s sound
for (let i = 0; i < sampleRate * 1.0; i++) pcmBuffer[i] = 0.5;
// 1s-2s silence (0.0)
// 2s-3s sound
for (let i = sampleRate * 2.0; i < sampleRate * 3.0; i++) pcmBuffer[i] = 0.5;

const silences = SilenceDetector.detectSilenceFromPcm(pcmBuffer, sampleRate, {
  thresholdDb: -30,
  minDuration: 0.6,
  preRoll: 0.05,
  postRoll: 0.05,
});
assert(silences.length === 1 && silences[0].duration > 0.7, 'Audio RMS Silence Detection with Cushions');

// Smart Cut Rough Cut Suggestions
const aiEngine = AIEngine.getInstance();
const suggestions = aiEngine.generateSmartCutSuggestions(silences, detectedScenes);
assert(
  suggestions.length >= 2 && suggestions.some((s) => s.type === 'silence'),
  'Smart Cut Rough Cut Suggestion Engine'
);

// Subtitle Line Wrapping & Word Timing
const wrapped = TranscriptionEngine.wrapTextIntoLines('Nusantara Video Studio menghadirkan fitur AI assisted editing yang cepat', 42, 2);
const wordTimings = TranscriptionEngine.alignWordsToSegment('Halo Nusantara', 0.0, 1.0);
assert(
  wrapped.split('\n').length === 2 && wordTimings.length === 2 && wordTimings[1].end === 1.0,
  'Transcription Word Timing & Subtitle Cue Formatting'
);

// Smart Reframe 16:9 to 9:16
const reframe = SmartReframeEngine.calculateReframe({ sourceWidth: 1920, sourceHeight: 1080, targetAspectRatio: '9:16' });
assert(reframe.recommendedScale > 3.0 && reframe.targetAspectRatio === '9:16', 'Smart Reframe Aspect Ratio Crop Calculations');

// Audio Cleanup DSP Filter Profile
const cleanup = AudioCleanupEngine.analyzeAndGenerateCleanupProfile({
  removeRumble: true,
  removeHum: true,
  humFrequency: 50,
  noiseReductionDb: -12,
  normalizeLoudness: true,
  currentPeakDb: -6.0,
  targetPeakDb: -1.0,
});
assert(
  cleanup.highPassCutoffHz === 80 && cleanup.notchCutoffHz === 50 && cleanup.peakDbGain === 5.0,
  'Audio Cleanup Filter Profile Generation'
);


// ------------------------------------------------------------------
// 6. PHASE 8: PROFESSIONAL EDITING WORKFLOW TESTS
// ------------------------------------------------------------------
console.log('\n[SECTION 6: PROFESSIONAL EDITING WORKFLOW (PHASE 8)]');

const { ProxyManager } = await import('../engine/workflow/ProxyManager');
const { RelinkEngine } = await import('../engine/workflow/RelinkEngine');
const { ProjectArchiveManager } = await import('../engine/workflow/ProjectArchiveManager');
const { AutosaveRecoveryManager } = await import('../engine/workflow/AutosaveRecoveryManager');
const { MarkerManager } = await import('../engine/workflow/MarkerManager');
const { MulticamManager } = await import('../engine/workflow/MulticamManager');
const { ShortcutManager } = await import('../engine/workflow/ShortcutManager');
const { TaskManager } = await import('../engine/workflow/TaskManager');
const { ProjectHealthChecker } = await import('../engine/workflow/ProjectHealthChecker');
const { DEFAULT_BINS } = await import('../stores/workflowStore');

// 1. Proxy Dimensions
const proxyEngine = ProxyManager.getInstance();
const pDimHalf = proxyEngine.calculateProxyDimensions(1920, 1080, 'half');
const pDimQuarter = proxyEngine.calculateProxyDimensions(1920, 1080, 'quarter');
const pDim540 = proxyEngine.calculateProxyDimensions(1920, 1080, '540p');
const pDim720 = proxyEngine.calculateProxyDimensions(3840, 2160, '720p');
assert(
  pDimHalf.width === 960 &&
    pDimHalf.height === 540 &&
    pDimQuarter.width === 480 &&
    pDimQuarter.height === 270 &&
    pDim540.height === 540 &&
    pDim720.height === 720,
  'Proxy Media Resolution Scaling (Half, Quarter, 540p, 720p)'
);

// 2. Media Relink Multi-Criteria Heuristics
const mockOfflineMedia = [
  {
    id: 'off-1',
    name: 'Interview_A.mp4',
    type: 'video' as const,
    duration: 10.0,
    size: 20000000,
    url: '',
    path: '/media/raw/Interview_Raw.mp4',
    extension: 'mp4',
    createdAt: new Date().toISOString(),
    status: 'offline' as const,
  },
];
const relinkScan = await RelinkEngine.scanFolderForMissingMedia(mockOfflineMedia, '/media/raw');
assert(
  relinkScan.candidates.length > 0 &&
    relinkScan.candidates[0].confidence === 'Strong Match' &&
    relinkScan.candidates[0].reasons.length > 0,
  'Media Relink Heuristic Multi-Criteria Matching'
);

// 3. Project Archive Dependency Validation & .nvarc
const archiveValid = ProjectArchiveManager.validateArchive(sampleProject, {
  includeProjectFile: true,
  includeUsedMedia: true,
  includeAudio: true,
  includeImages: true,
  includeGraphics: true,
  includeSubtitles: true,
  includeProxyFiles: false,
  includeCache: false,
  includeUnusedMedia: false,
});
const { manifest: arcManifest } = await ProjectArchiveManager.createProjectArchive(sampleProject);
assert(
  archiveValid.canProceed === true &&
    archiveValid.totalEstimatedBytes > 0 &&
    arcManifest.manifestVersion === 1,
  'Project Archive Asset Dependency Audit & .nvarc Manifest'
);

// 4. Autosave & Crash Recovery
const backupSnapshot = AutosaveRecoveryManager.createBackup(sampleProject, 'Autosave Test Point');
AutosaveRecoveryManager.saveCrashRecoverySession(sampleProject);
const recovSession = AutosaveRecoveryManager.getPendingRecovery();
assert(
  backupSnapshot.id.length > 0 &&
    recovSession !== null &&
    recovSession.projectId === sampleProject.id,
  'Autosave Snapshot Preservation & Crash Recovery Detection'
);
AutosaveRecoveryManager.clearCrashRecoverySession();

// 5. Extended Project Metadata & Schema 6
const schema6Result = fileService.validateProjectSchema({
  ...sampleProject,
  projectVersion: 6 as any,
  projectMetadata: {
    id: sampleProject.id,
    name: sampleProject.name,
    applicationVersion: '0.8.0',
    schemaVersion: 6,
    frameRate: 30,
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    client: 'Nusantara Video Studio',
    copyright: '© 2026 Nusantara',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
} as any);
assert(schema6Result === true, 'Project Schema Version 6 Specification Validation');

// 6. Project Bins Hierarchy
assert(
  DEFAULT_BINS.length >= 10 &&
    DEFAULT_BINS.some((b) => b.name === 'Video') &&
    DEFAULT_BINS.some((b) => b.name === 'Audio') &&
    DEFAULT_BINS.some((b) => b.name === 'Exports'),
  'Project Bins Folder Hierarchy Structure'
);

// 7. Timeline Markers Engine
const marker = MarkerManager.createMarker(8.4, 'Scene 3 In-Point', 'scene', {
  duration: 1.5,
  color: '#f97316',
});
assert(
  marker.time === 8.4 && marker.type === 'scene' && marker.duration === 1.5,
  'Professional Range & Typed Timeline Markers'
);

// 8. Multicam Preparation & Audio Sync
const multiGroup = MulticamManager.createGroup(
  'Concert Angles',
  [
    { id: 'cam-a', name: 'Stage_Center.mp4', type: 'video' } as any,
    { id: 'cam-b', name: 'Stage_Left.mp4', type: 'video' } as any,
  ],
  'audio'
);
const syncRes = MulticamManager.syncByAudio(multiGroup);
assert(
  multiGroup.angles.length === 2 && syncRes.success === true,
  'Multicam Grouping & Waveform Audio Sync'
);

// 9. Keyboard Shortcuts & Conflict Detection
const shortcuts = ShortcutManager.getShortcuts();
const collision = ShortcutManager.findConflict('cmd-zoom-in', 'Ctrl+N', shortcuts);
assert(
  collision !== null && collision.command === 'New Project',
  'Keyboard Shortcut Collision & Conflict Detection'
);

// 10. Background Task Manager
const taskManager = TaskManager.getInstance();
let bgDone: boolean = false;
taskManager.addTask('Phase 8 Proxy Batch', 'proxy', 'normal', async (up) => {
  up(100);
  bgDone = true;
});
await new Promise((r) => setTimeout(r, 60));
assert(Boolean(bgDone), 'Asynchronous Background Task Manager Lifecycle');

// 11. Project Health Checker
const healthReport = ProjectHealthChecker.checkProject(sampleProject);
assert(
  typeof healthReport.healthScore === 'number' && healthReport.healthScore >= 0,
  'Project Health Integrity Check & Optimization Audit'
);

// ------------------------------------------------------------------
// 7. PROFESSIONAL RENDERING & EXPORT ENGINE (PHASE 9)
// ------------------------------------------------------------------
console.log('\n[SECTION 7: PROFESSIONAL RENDERING & EXPORT ENGINE (PHASE 9)]');

// 1. Render Capabilities Discovery
const capService = RenderCapabilitiesService.getInstance();
const capabilities = await capService.getCapabilities();
assert(
  capabilities.containers.some((c) => c.format === 'mp4') &&
    capabilities.containers.some((c) => c.format === 'mov') &&
    capabilities.containers.some((c) => c.format === 'webm') &&
    capabilities.videoCodecs.some((v) => v.id === 'h264'),
  'Codec & Container Real Capabilities Discovery',
  `Containers: ${capabilities.containers.map((c) => c.format).join(', ')}`
);

// 2. Built-in Technical Quality Presets
const renderPresets = RenderPresetManager.getPresets();
const yt4k = renderPresets.find((p) => p.name === 'YouTube 4K');
const reels = renderPresets.find((p) => p.name === 'Instagram Reels');
const master = renderPresets.find((p) => p.name === 'Archive Master');
assert(
  yt4k !== undefined &&
    yt4k.settings.width === 3840 &&
    yt4k.settings.height === 2160 &&
    reels !== undefined &&
    reels.settings.width === 1080 &&
    reels.settings.height === 1920 &&
    master !== undefined &&
    master.settings.qualityPreset === 'master',
  'Export Presets Technical Parameter Fidelity'
);

// 3. Custom Presets Persistence
const customPreset = RenderPresetManager.saveCustomPreset('Client High-Bitrate', 'web', {
  format: 'mp4',
  videoCodec: 'h264',
  width: 1920,
  height: 1080,
  fps: 60,
  targetBitrateMbps: 35,
});
assert(
  customPreset.id.length > 0 &&
    RenderPresetManager.getPresetById(customPreset.id)?.settings.targetBitrateMbps === 35,
  'Custom Export Preset Save & Retrieve Lifecycle'
);
RenderPresetManager.deleteCustomPreset(customPreset.id);

// 4. Render Settings Validator & Encoder Parity Rules
const validSettings = RenderSettingsManager.getLastSettings(sampleProject);
const validRes = RenderValidator.validateSettings(validSettings, capabilities, sampleProject);
assert(validRes.isValid === true, 'Standard 1080p Render Settings Validation');

// Invalid dimensions (odd numbers prohibited by H.264/H.265 encoders)
const invalidOddSettings = { ...validSettings, width: 1921, height: 1080 };
const oddRes = RenderValidator.validateSettings(invalidOddSettings, capabilities, sampleProject);
assert(
  oddRes.isValid === false && oddRes.errors.some((e) => e.includes('genap')),
  'Encoder Parity Dimension Validation (Even Width/Height)'
);

// Frame Rate Mismatch Warning (Requirement 15)
const fpsMismatchSettings = { ...validSettings, fps: 60 };
const fpsRes = RenderValidator.validateSettings(fpsMismatchSettings, capabilities, sampleProject);
assert(
  fpsRes.warnings.some((w) => w.includes('berbeda dari project FPS')),
  'Frame Rate Mismatch Warning Detection (Output 60 vs Project 30)'
);

// 5. Hardware Acceleration Resolver & CPU Fallback
const profile = await HardwareAccelerationManager.resolveEncoderProfile('auto', 'h264');
assert(
  typeof profile.ffmpegEncoderName === 'string' &&
    profile.ffmpegEncoderName.length > 0 &&
    typeof profile.isFallbackCpu === 'boolean',
  'Hardware Acceleration Profile Resolution & CPU Fallback'
);

// 6. Unified Source-of-Truth RenderGraph Compilation
const renderGraph = RenderEngine.buildRenderGraph(sampleProject, validSettings);
assert(
  renderGraph.fps === 30 &&
    renderGraph.width === 1920 &&
    renderGraph.height === 1080 &&
    Array.isArray(renderGraph.videoTracks) &&
    Array.isArray(renderGraph.audioTracks),
  'Unified Source-of-Truth RenderGraph Compilation'
);

// 7. FFmpeg Execution Arguments Generation
const execPlan = await FFmpegAdapter.buildExecutionArgs(renderGraph, validSettings);
assert(
  execPlan.args.includes('-y') &&
    execPlan.args.includes(validSettings.outputPath || 'output.mp4') &&
    execPlan.args.includes('-ar') &&
    execPlan.args.includes('48000'),
  'FFmpeg Execution Arguments Array Compilation'
);

// 8. Timeline Markers to FFmetadata Chapter Conversion
const chapterMetadata = FFmpegAdapter.generateChapterMetadata(
  [
    { time: 0, label: 'Intro' },
    { time: 4.5, label: 'Main Feature', duration: 5.5 },
  ],
  10
);
assert(
  chapterMetadata.includes(';FFMETADATA1') &&
    chapterMetadata.includes('[CHAPTER]') &&
    chapterMetadata.includes('START=0') &&
    chapterMetadata.includes('title=Intro') &&
    chapterMetadata.includes('title=Main Feature'),
  'Timeline Markers to FFmetadata Chapter Syntax'
);

// 9. Frame-Accurate Keyframe Interpolation
const keyframes = [
  { time: 0, value: 0 },
  { time: 2, value: 100 },
  { time: 4, value: 20 },
];
const midVal = FrameRenderer.evaluateAnimatedProperty(keyframes, 1.0, 0);
assert(
  midVal === 50,
  'FrameRenderer Frame-Accurate Motion Interpolation (t=1.0s => 50)',
  `Calculated: ${midVal}`
);

// 10. Professional Audio Mixdown with Limiter & Loudness Normalization
const audioPlan = AudioRenderer.buildAudioEncodingArgs(renderGraph, {
  ...validSettings,
  audioNormalization: 'lufs_14',
});
assert(
  audioPlan.audioArgs.some((arg) => arg.includes('alimiter=limit=-0.1dB')) &&
    audioPlan.audioArgs.some((arg) => arg.includes('loudnorm=I=-14')),
  'Audio Pipeline Limiter (-0.1dB) & Loudness Normalization (-14 LUFS)'
);

// 11. Render Queue Lifecycle & Job Management
const queueMgr = RenderQueueManager.getInstance();
const renderTestJob = new RenderJobInstance('p-test', 'Nusantara Showcase', validSettings);
queueMgr.addJob(renderTestJob);
assert(
  queueMgr.getJobs().some((j) => j.id === renderTestJob.id),
  'Render Queue Enqueue Job'
);

const duplicated = queueMgr.duplicateJob(renderTestJob.id);
assert(
  duplicated !== null && duplicated.projectName.includes('(Duplikat)'),
  'Render Queue Duplicate Job'
);

if (duplicated) {
  queueMgr.moveUp(duplicated.id);
  queueMgr.removeJob(duplicated.id);
}
queueMgr.removeJob(renderTestJob.id);
queueMgr.clearCompleted();

console.log('\n======================================================');
console.log(` RESULTS: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
