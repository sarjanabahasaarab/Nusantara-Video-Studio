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
assert(parsedProj.valid === true && parsedProj.project?.projectVersion === 4, 'Project Serialization .nvproj v4 Schema');

console.log('\n======================================================');
console.log(` RESULTS: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
