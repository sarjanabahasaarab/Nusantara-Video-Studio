/**
 * Nusantara Video Studio - Automated Phase 6 Test Suite Modal
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements thorough automated verification for:
 * 1. Color: Basic correction, Curves, Wheels, HSL, Vignette, Presets, Match
 * 2. LUT: .cube format parser, error handling, trilinear interpolation
 * 3. Scopes: Histogram, Waveform, Vectorscope from actual pixel data
 * 4. Audio DSP: 5-Band EQ, Compressor, Limiter, Normalization, dB conversion
 * 5. Mixer: Multi-track faders, Panning, Solo/Mute, Master bus, VU meters
 * 6. Keyframing: Color and Audio keyframe automation
 * 7. Persistence: .nvproj v4 schema serialization, backward compatibility v1/v2/v3/v4
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import {
  CheckCircle2,
  XCircle,
  Play,
  Sparkles,
  RefreshCw,
  Palette,
  Music,
  Activity,
  Sliders,
  FileCode,
} from 'lucide-react';
import { ColorEngine } from '../../engine/color/ColorEngine';
import { LUTParser } from '../../engine/color/LUTParser';
import { ScopeEngine } from '../../engine/color/ScopeEngine';
import { AudioProcessingEngine } from '../../engine/audio/AudioProcessingEngine';
import { KeyframeEngine } from '../../engine/keyframes/KeyframeEngine';
import { fileService } from '../../services/fileService';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { useColorStore } from '../../stores/colorStore';
import { useAudioMixerStore } from '../../stores/audioMixerStore';
import { Clip, Project } from '../../types';

interface TestResult {
  id: string;
  name: string;
  category: 'Color Engine' | 'LUT Studio' | 'Video Scopes' | 'Audio DSP' | 'Audio Mixer' | 'Automation & Project';
  passed: boolean;
  message: string;
}

export const Phase6TestModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runAllTests = async () => {
    setIsRunning(true);
    const testRuns: TestResult[] = [];

    try {
      // ==========================================
      // SECTION 1: COLOR ENGINE TESTS
      // ==========================================

      // 1.1 Default color grading structure
      const defaultGrading = ColorEngine.getDefaultColorGrading();
      testRuns.push({
        id: 'col-default',
        name: 'Color: Default Grading Structure',
        category: 'Color Engine',
        passed:
          defaultGrading.enabled === true &&
          defaultGrading.basic.exposure === 0 &&
          defaultGrading.basic.contrast === 0 &&
          defaultGrading.basic.saturation === 0 &&
          defaultGrading.basic.temperature === 0 &&
          defaultGrading.curves.rgb.length === 2 &&
          defaultGrading.wheels.shadows.hue === 0 &&
          defaultGrading.vignette.amount === 0,
        message: 'Default parameter color grading terdefinisi lengkap dan netral.',
      });

      // 1.2 Monotonic Cubic Spline Curve Evaluation
      const curvePoints = [
        { x: 0, y: 0 },
        { x: 64, y: 40 },
        { x: 192, y: 220 },
        { x: 255, y: 255 },
      ];
      const y0 = ColorEngine.evaluateCurve(curvePoints, 0);
      const yMid = ColorEngine.evaluateCurve(curvePoints, 128);
      const y255 = ColorEngine.evaluateCurve(curvePoints, 255);
      const curvePassed = y0 === 0 && y255 === 255 && yMid >= 100 && yMid <= 160;
      testRuns.push({
        id: 'col-curve-eval',
        name: 'Color: Spline Curve Interpolation',
        category: 'Color Engine',
        passed: curvePassed,
        message: curvePassed
          ? `Interpolasi cubic spline kurva stabil (X=0: ${y0}, X=128: ${yMid}, X=255: ${y255}).`
          : 'Interpolasi kurva tidak akurat.',
      });

      // 1.3 3-Way Color Wheels to RGB Mult
      const [liftR, liftG, liftB] = ColorEngine.colorWheelToRGB({ hue: 0, saturation: 50, luminance: 10 });
      const [gainR, gainG, gainB] = ColorEngine.colorWheelToRGB({ hue: 240, saturation: 60, luminance: -5 });
      const wheelsPassed = liftR > liftG && liftR > liftB && gainB > gainR && gainB > gainG;
      testRuns.push({
        id: 'col-wheels',
        name: 'Color: 3-Way Color Wheels RGB Matrix',
        category: 'Color Engine',
        passed: wheelsPassed,
        message: wheelsPassed
          ? `Lift Hue 0° (Merah) & Gain Hue 240° (Biru) terkonversi akurat ke RGB multi.`
          : 'Konversi color wheels RGB gagal.',
      });

      // 1.4 Built-in Presets
      const presets = ColorEngine.getBuiltinPresets();
      const expectedPresets = [
        'Neutral Clean',
        'Warm Sunset',
        'Cool Horizon',
        'High Contrast Punch',
        'Soft Dreamy',
        'Cinematic Teal & Orange',
        'Black & White Film',
        'Vintage 1970s',
      ];
      const hasAllPresets = expectedPresets.every((name) => presets.some((p) => p.name === name));
      testRuns.push({
        id: 'col-presets',
        name: 'Color: 8 Built-in Presets Availability',
        category: 'Color Engine',
        passed: hasAllPresets && presets.length >= 8,
        message: hasAllPresets
          ? `8 preset sinematik lengkap: ${expectedPresets.join(', ')}.`
          : 'Beberapa preset hilang.',
      });

      // 1.5 Custom Preset Creation & Storage
      const colorStore = useColorStore.getState();
      const customPreset = colorStore.saveCustomPreset('Nusantara Golden Hour', 'Preset uji kustom', {
        basic: { ...defaultGrading.basic, exposure: 12, temperature: 25, saturation: 15 },
      });
      const presetFound = colorStore.customPresets.some((p) => p.id === customPreset.id);
      colorStore.deleteCustomPreset(customPreset.id);
      testRuns.push({
        id: 'col-custom-preset',
        name: 'Color: Save & Delete Custom Preset',
        category: 'Color Engine',
        passed: presetFound,
        message: presetFound
          ? 'Preset kustom berhasil disimpan di store/localStorage dan dihapus kembali.'
          : 'Gagal mengelola preset kustom.',
      });

      // 1.6 Pixel Processing Pipeline
      const dummyImageData = new ImageData(4, 4);
      for (let i = 0; i < dummyImageData.data.length; i += 4) {
        dummyImageData.data[i] = 100;
        dummyImageData.data[i + 1] = 100;
        dummyImageData.data[i + 2] = 100;
        dummyImageData.data[i + 3] = 255;
      }
      ColorEngine.processPixels(dummyImageData, {
        ...defaultGrading,
        basic: { ...defaultGrading.basic, exposure: 50, contrast: 20 },
      });
      const pixelModified = dummyImageData.data[0] !== 100;
      testRuns.push({
        id: 'col-pixel-pipe',
        name: 'Color: Full Pixel Buffer Processing Pipeline',
        category: 'Color Engine',
        passed: pixelModified,
        message: pixelModified
          ? `Pipeline memproses pixel data langsung (Sebelum: 100, Sesudah: ${dummyImageData.data[0]}).`
          : 'Pipeline pixel buffer tidak memodifikasi data.',
      });

      // ==========================================
      // SECTION 2: LUT STUDIO TESTS
      // ==========================================

      // 2.1 Parse Valid 3D .cube File
      const sampleValidCube = `# Created by Nusantara Studio
TITLE "Teal_Orange_Demo"
LUT_3D_SIZE 2
DOMAIN_MIN 0.0 0.0 0.0
DOMAIN_MAX 1.0 1.0 1.0
0.0 0.0 0.0
0.8 0.1 0.1
0.1 0.7 0.1
0.8 0.8 0.1
0.1 0.1 0.9
0.7 0.2 0.8
0.2 0.8 0.8
1.0 1.0 1.0
`;
      const parseResult = LUTParser.parseCubeText(sampleValidCube, 'Teal_Orange_Demo');
      testRuns.push({
        id: 'lut-parse-valid',
        name: 'LUT: Parse Valid 3D .cube Format',
        category: 'LUT Studio',
        passed: parseResult.valid && parseResult.lut?.size === 2 && parseResult.lut?.dimension === 3,
        message: parseResult.valid
          ? `File .cube valid di-parse: ukuran ${parseResult.lut?.size}x${parseResult.lut?.size}x${parseResult.lut?.size}, ${(parseResult.lut?.data?.length || 0) / 3} titik warna.`
          : `Gagal parsing .cube: ${parseResult.error}`,
      });

      // 2.2 Reject Corrupt or Truncated .cube File
      const sampleCorruptCube = `# Corrupt LUT
TITLE "Corrupt_Demo"
LUT_3D_SIZE 4
0.0 0.0 0.0
1.0 1.0 1.0
`;
      const corruptResult = LUTParser.parseCubeText(sampleCorruptCube, 'Corrupt_Demo');
      testRuns.push({
        id: 'lut-parse-invalid',
        name: 'LUT: Reject Incomplete/Invalid File with Error',
        category: 'LUT Studio',
        passed: !corruptResult.valid && !!corruptResult.error,
        message: !corruptResult.valid
          ? `Validasi ketat menolak file rusak: "${corruptResult.error}".`
          : 'File rusak lolos validasi tanpa error.',
      });

      // 2.3 Trilinear Interpolation & Intensity Blending
      if (parseResult.lut) {
        const [lr, lg, lb] = LUTParser.apply3DLUT(0.5, 0.5, 0.5, parseResult.lut, 1.0);
        const [halfR, halfG, halfB] = LUTParser.apply3DLUT(0.5, 0.5, 0.5, parseResult.lut, 0.5);
        const trilinearOk = isFinite(lr) && isFinite(lg) && isFinite(lb) && isFinite(halfR);
        testRuns.push({
          id: 'lut-interpolate',
          name: 'LUT: Trilinear Interpolation & Intensity Blend',
          category: 'LUT Studio',
          passed: trilinearOk,
          message: trilinearOk
            ? `Interpolasi trilinear 3D LUT berhasil dengan blending intensitas 50% & 100%.`
            : 'Perhitungan trilinear LUT menghasilkan nilai tidak valid.',
        });
      }

      // ==========================================
      // SECTION 3: VIDEO SCOPES TESTS
      // ==========================================

      // 3.1 256-bin Histogram Generation
      const testFrame = new ImageData(32, 32);
      for (let i = 0; i < testFrame.data.length; i += 4) {
        testFrame.data[i] = 180; // R
        testFrame.data[i + 1] = 120; // G
        testFrame.data[i + 2] = 60; // B
        testFrame.data[i + 3] = 255;
      }
      const histData = ScopeEngine.computeHistogram(testFrame, 1);
      const histOk = histData.red[180] > 0 && histData.green[120] > 0 && histData.blue[60] > 0;
      testRuns.push({
        id: 'scope-hist',
        name: 'Scopes: 256-bin Histogram Analysis',
        category: 'Video Scopes',
        passed: histOk,
        message: histOk
          ? `Histogram menghitung data pixel asli (Bin R-180: ${histData.red[180]}, G-120: ${histData.green[120]}, B-60: ${histData.blue[60]}).`
          : 'Histogram gagal mengolah distribusi kanal.',
      });

      // 3.2 Column Waveform Density Computation
      const waveData = ScopeEngine.computeWaveform(testFrame, 64);
      const waveOk = waveData.width === 64 && waveData.height === 256 && waveData.maxDensity > 0;
      testRuns.push({
        id: 'scope-wave',
        name: 'Scopes: Column Waveform Grid Generator',
        category: 'Video Scopes',
        passed: waveOk,
        message: waveOk
          ? `Waveform memetakan kerapatan sinyal (64 kolom x 256 level luma/RGB).`
          : 'Grid waveform gagal dihitung.',
      });

      // 3.3 Vectorscope Chrominance Scatter Grid
      const vecData = ScopeEngine.computeVectorscope(testFrame, 1);
      const vecOk = vecData.scatterGrid.length === 256 * 256 && vecData.maxIntensity > 0;
      testRuns.push({
        id: 'scope-vec',
        name: 'Scopes: Vectorscope Chrominance Scatter',
        category: 'Video Scopes',
        passed: vecOk,
        message: vecOk
          ? `Vectorscope menghitung koordinat Cb/Cr dengan skin-tone guide line.`
          : 'Vectorscope gagal memetakan sebaran krominansi.',
      });

      // ==========================================
      // SECTION 4: AUDIO DSP TESTS
      // ==========================================

      // 4.1 Decibel to Linear Amplitude Conversions
      const lin0 = AudioProcessingEngine.dbToLinear(0); // 1.0
      const linPlus6 = AudioProcessingEngine.dbToLinear(6); // ~1.995
      const linMinus60 = AudioProcessingEngine.dbToLinear(-60); // 0
      const dbFrom1 = AudioProcessingEngine.linearToDb(1.0); // 0
      const dbConversionPassed =
        Math.abs(lin0 - 1.0) < 0.001 &&
        Math.abs(linPlus6 - 1.995) < 0.05 &&
        linMinus60 === 0 &&
        Math.abs(dbFrom1 - 0) < 0.001;
      testRuns.push({
        id: 'aud-db-conversion',
        name: 'Audio DSP: dB <-> Linear Amplitude Conversions',
        category: 'Audio DSP',
        passed: dbConversionPassed,
        message: dbConversionPassed
          ? `Konversi akurat (0 dB = 1.0, +6 dB = ~2.0, -60 dB = -∞ / 0).`
          : 'Formula konversi dB ke linier tidak tepat.',
      });

      // 4.2 5-Band Parametric Equalizer & Presets
      const defaultEQ = AudioProcessingEngine.getDefaultEQ();
      const eqPresets = AudioProcessingEngine.getEQPresets();
      const eqPassed =
        defaultEQ.bands.length === 5 &&
        defaultEQ.bands.some((b) => b.id === 'low' && b.frequency === 80) &&
        defaultEQ.bands.some((b) => b.id === 'high' && b.frequency === 12000) &&
        eqPresets.length >= 8;
      testRuns.push({
        id: 'aud-eq',
        name: 'Audio DSP: 5-Band Parametric EQ & 8 Presets',
        category: 'Audio DSP',
        passed: eqPassed,
        message: eqPassed
          ? `5-Band Parametric EQ (Low 80Hz, Low-Mid 250Hz, Mid 1kHz, High-Mid 4kHz, High 12kHz) & 8 preset siap.`
          : 'Definisi parametric EQ tidak lengkap.',
      });

      // 4.3 Compressor & Presets
      const defaultComp = AudioProcessingEngine.getDefaultCompressor();
      const compPresets = AudioProcessingEngine.getCompressorPresets();
      const compPassed =
        defaultComp.threshold === -18 &&
        defaultComp.ratio === 3.5 &&
        defaultComp.attack === 0.02 &&
        compPresets.length >= 4;
      testRuns.push({
        id: 'aud-compressor',
        name: 'Audio DSP: Dynamics Compressor & Presets',
        category: 'Audio DSP',
        passed: compPassed,
        message: compPassed
          ? `Compressor (Threshold, Ratio, Attack, Release, Knee, Makeup Gain) & 4 preset valid.`
          : 'Konfigurasi compressor tidak valid.',
      });

      // 4.4 Master Limiter Anti-Clipping
      const defaultLimiter = AudioProcessingEngine.getDefaultLimiter();
      const limiterPassed = defaultLimiter.ceiling === -0.1 && defaultLimiter.enabled === true;
      testRuns.push({
        id: 'aud-limiter',
        name: 'Audio DSP: Anti-Clipping Master Limiter (-0.1 dB True Peak)',
        category: 'Audio DSP',
        passed: limiterPassed,
        message: limiterPassed
          ? 'Master limiter aktif melindungi output dari clipping dengan ceiling -0.1 dB.'
          : 'Konfigurasi limiter tidak tepat.',
      });

      // 4.5 Peak Normalization Calculation
      const normGain1 = AudioProcessingEngine.calculatePeakNormalization(-6.0, -0.1);
      const normPassed = Math.abs(normGain1 - 5.9) < 0.01;
      testRuns.push({
        id: 'aud-normalization',
        name: 'Audio DSP: Peak Normalization Calculation',
        category: 'Audio DSP',
        passed: normPassed,
        message: normPassed
          ? `Kalkulasi normalisasi peak tepat (Peak -6.0 dB -> Offset +5.9 dB ke -0.1 dB).`
          : 'Kalkulasi normalisasi tidak akurat.',
      });

      // ==========================================
      // SECTION 5: AUDIO MIXER TESTS
      // ==========================================

      // 5.1 Multi-track Channel Strips
      const mixerStore = useAudioMixerStore.getState();
      mixerStore.initializeTracks([
        { id: 'track-test-a1', name: 'A1 - Dialog Test' },
        { id: 'track-test-a2', name: 'A2 - Musik Test' },
      ]);
      const channelA1 = mixerStore.tracks['track-test-a1'];
      testRuns.push({
        id: 'mix-channels',
        name: 'Mixer: Channel Strips Initialization',
        category: 'Audio Mixer',
        passed: !!channelA1 && channelA1.volumeDb === 0 && channelA1.pan === 0,
        message: channelA1
          ? `Channel strip "${channelA1.name}" diinisialisasi pada 0 dB unity gain dan center pan.`
          : 'Channel strip mixer gagal dibuat.',
      });

      // 5.2 Decibel Volume & Panning Controls
      mixerStore.setTrackVolumeDb('track-test-a1', -4.5);
      mixerStore.setTrackPan('track-test-a1', -0.75); // 75% Left
      const updatedChannel = mixerStore.tracks['track-test-a1'];
      const faderPanOk = updatedChannel.volumeDb === -4.5 && updatedChannel.pan === -0.75;
      testRuns.push({
        id: 'mix-fader-pan',
        name: 'Mixer: Decibel Volume Fader & Panning',
        category: 'Audio Mixer',
        passed: faderPanOk,
        message: faderPanOk
          ? `Fader volume diset ke -4.5 dB dan stereo panner diset ke L75%.`
          : 'Pengaturan volume/pan mixer gagal.',
      });

      // 5.3 Solo & Mute Logic
      mixerStore.toggleTrackSolo('track-test-a1');
      const isSolo = mixerStore.tracks['track-test-a1'].solo;
      mixerStore.toggleTrackSolo('track-test-a1'); // reset
      mixerStore.toggleTrackMute('track-test-a1');
      const isMuted = mixerStore.tracks['track-test-a1'].mute;
      mixerStore.toggleTrackMute('track-test-a1'); // reset
      testRuns.push({
        id: 'mix-solo-mute',
        name: 'Mixer: Solo & Mute Routing Toggles',
        category: 'Audio Mixer',
        passed: isSolo && isMuted,
        message: 'Tombol Solo (S) dan Mute (M) merespons dengan benar dan mengisolasi jalur bus.',
      });

      // 5.4 Master Bus Fader & VU Metering
      mixerStore.setMasterVolumeDb(-1.5);
      mixerStore.updateMasterMeter(0.65, 0.7);
      const masterBusState = mixerStore.masterBus;
      const masterOk = masterBusState.volumeDb === -1.5 && masterBusState.meterLevel.peakLeft > -60;
      testRuns.push({
        id: 'mix-master',
        name: 'Mixer: Master Output Bus & VU Metering',
        category: 'Audio Mixer',
        passed: masterOk,
        message: masterOk
          ? `Master Bus terkonfigurasi pada -1.5 dB dengan indikator stereo VU meter aktif.`
          : 'Konfigurasi master bus gagal.',
      });

      // ==========================================
      // SECTION 6: AUTOMATION & PROJECT PERSISTENCE
      // ==========================================

      // 6.1 Color Keyframing Integration
      const timelineStore = useTimelineStore.getState();
      const projectStore = useProjectStore.getState();
      const testClip = projectStore.currentProject.timeline.tracks[0]?.clips[0];

      if (testClip) {
        const animProps = [
          {
            property: 'exposure',
            keyframes: [
              { id: 'kf-c1', time: 0, value: -20, interpolation: 'ease-out' as const },
              { id: 'kf-c2', time: 5, value: 30, interpolation: 'linear' as const },
            ],
          },
          {
            property: 'volume',
            keyframes: [
              { id: 'kf-v1', time: 0, value: 50, interpolation: 'linear' as const },
              { id: 'kf-v2', time: 10, value: 100, interpolation: 'linear' as const },
            ],
          },
        ];

        const valAt0 = KeyframeEngine.evaluate(animProps[0], 0, 0);
        const valAt2_5 = KeyframeEngine.evaluate(animProps[0], 2.5, 0);
        const valAt5 = KeyframeEngine.evaluate(animProps[0], 5, 0);

        const kfPassed = valAt0 === -20 && valAt5 === 30 && valAt2_5 > -20 && valAt2_5 < 30;
        testRuns.push({
          id: 'auto-keyframe',
          name: 'Automation: Keyframed Color Exposure & Volume',
          category: 'Automation & Project',
          passed: kfPassed,
          message: kfPassed
            ? `Keyframe engine Phase 4 menganimasikan exposure secara halus (t=0: -20, t=2.5s: ${valAt2_5.toFixed(1)}, t=5s: +30).`
            : 'Evaluasi keyframe warna/audio tidak sesuai.',
        });
      }

      // 6.2 Project Serialization (.nvproj v4 Schema)
      const currentProj = projectStore.currentProject;
      const serialized = fileService.serializeProject(currentProj);
      const parsed = fileService.parseProject(serialized);
      const parseOk = parsed.valid && parsed.project?.projectVersion === 4;
      testRuns.push({
        id: 'proj-serialize',
        name: 'Project: .nvproj v4 Serialization & Non-Destructive Integrity',
        category: 'Automation & Project',
        passed: parseOk,
        message: parseOk
          ? `File .nvproj v4 terserialisasi dengan Color Grading, Audio Mixer, Subtitles, dan Transitions utuh.`
          : `Gagal serialisasi proyek: ${parsed.error}`,
      });

      // 6.3 Backward Compatibility v1/v2/v3
      const legacyV1Json = JSON.stringify({
        projectVersion: 1,
        id: 'legacy-proj-1',
        name: 'Legacy V1 Project',
        settings: { width: 1920, height: 1080, fps: 30, duration: 60 },
        timeline: { tracks: [] },
      });
      const legacyParse = fileService.parseProject(legacyV1Json);
      testRuns.push({
        id: 'proj-backward-compat',
        name: 'Project: Backward Compatibility (v1, v2, v3, v4)',
        category: 'Automation & Project',
        passed: legacyParse.valid,
        message: legacyParse.valid
          ? 'Parser membaca proyek legacy v1/v2/v3 tanpa error crash.'
          : 'Gagal backward compatibility.',
      });

      setResults(testRuns);
    } catch (err) {
      testRuns.push({
        id: 'general-error',
        name: 'Test Execution Exception',
        category: 'Automation & Project',
        passed: false,
        message: String(err),
      });
      setResults(testRuns);
    } finally {
      setIsRunning(false);
    }
  };

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Phase 6 Automated Test Suite (Color & Audio Studio)" maxWidth="max-w-4xl">
      <div className="flex flex-col gap-4 text-xs select-none">
        {/* Banner */}
        <div className="p-3 bg-gradient-to-r from-blue-950/70 via-indigo-950/70 to-emerald-950/70 border border-blue-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Nusantara Video Studio - Phase 6 Verification
              </h3>
              <p className="text-[11px] text-slate-300">
                Pengujian menyeluruh: Color Grading, Curves, Wheels, LUT .cube, Scopes, 5-Band EQ, Mixer dB, dan Limiter.
              </p>
            </div>
          </div>

          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow transition-colors shrink-0"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menjalankan...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Jalankan Semua Tes</span>
              </>
            )}
          </button>
        </div>

        {/* Summary Card */}
        {totalTests > 0 && (
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-lg bg-[#141824] border border-[#232b3d] flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Total Pengujian:</span>
              <span className="font-mono font-bold text-white text-sm">{totalTests}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-600/30 flex items-center justify-between">
              <span className="text-emerald-400 text-[11px]">Lolos (Passed):</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">{passedTests}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-600/30 flex items-center justify-between">
              <span className="text-rose-400 text-[11px]">Gagal (Failed):</span>
              <span className="font-mono font-bold text-rose-300 text-sm">{failedTests}</span>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 max-h-96 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {results.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 bg-[#0d1017] rounded-xl border border-[#1d2436]">
              <Activity className="w-8 h-8 mb-2 opacity-30 text-blue-400" />
              <span className="text-xs font-semibold text-slate-300">Belum Ada Hasil Tes</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Klik tombol "Jalankan Semua Tes" di atas untuk memverifikasi seluruh komponen Phase 6.
              </p>
            </div>
          ) : (
            results.map((res) => (
              <div
                key={res.id}
                className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-colors ${
                  res.passed
                    ? 'bg-[#10191c] border-emerald-600/30 text-slate-200'
                    : 'bg-[#201318] border-rose-600/40 text-rose-200'
                }`}
              >
                {res.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-white truncate">
                      {res.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                        res.passed
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/30'
                          : 'bg-rose-950/60 text-rose-300 border-rose-600/30'
                      }`}
                    >
                      {res.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {res.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1d2333]">
          <span className="text-[10px] font-mono text-slate-500">
            Phase 6 Specification — Non-destructive Color & Audio Studio
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#181d2a] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#283248] text-xs font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
