/**
 * Nusantara Video Studio - Automated Media Test Suite Modal
 * Phase 2: Media Library & Media Import
 *
 * Runs automated verification tests on MediaStore, MediaService,
 * duplicate detection, format validation, search, filter, and sorting.
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useMediaStore } from '../../stores/mediaStore';
import { mediaService } from '../../services/mediaService';
import { MediaItem } from '../../types';
import { CheckCircle2, XCircle, Play, Sparkles, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  category: 'store' | 'service' | 'error';
  passed: boolean;
  message: string;
}

export const MediaTestModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const addMedia = useMediaStore((s) => s.addMedia);
  const removeMedia = useMediaStore((s) => s.removeMedia);

  // Helper to generate a virtual test file
  const createMockFile = (name: string, type: string, size = 1024 * 1024): File => {
    const blob = new Blob(['mock content data'], { type });
    return new File([blob], name, { type, lastModified: Date.now() });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    const testRuns: TestResult[] = [];

    try {
      // 1. Service Format Validation Tests
      const validMp4 = createMockFile('test_clip.mp4', 'video/mp4');
      const resMp4 = mediaService.validateFile(validMp4);
      testRuns.push({
        name: 'Validasi Format Video (.mp4)',
        category: 'service',
        passed: resMp4.valid && resMp4.type === 'video',
        message: resMp4.valid ? 'Tipe video terdeteksi dengan tepat.' : 'Gagal validasi video.',
      });

      const validMp3 = createMockFile('gamelan_beat.mp3', 'audio/mpeg');
      const resMp3 = mediaService.validateFile(validMp3);
      testRuns.push({
        name: 'Validasi Format Audio (.mp3)',
        category: 'service',
        passed: resMp3.valid && resMp3.type === 'audio',
        message: resMp3.valid ? 'Tipe audio terdeteksi dengan tepat.' : 'Gagal validasi audio.',
      });

      const validPng = createMockFile('logo_overlay.png', 'image/png');
      const resPng = mediaService.validateFile(validPng);
      testRuns.push({
        name: 'Validasi Format Gambar (.png)',
        category: 'service',
        passed: resPng.valid && resPng.type === 'image',
        message: resPng.valid ? 'Tipe gambar terdeteksi dengan tepat.' : 'Gagal validasi image.',
      });

      // 2. Unsupported format rejection test
      const invalidExe = createMockFile('virus.exe', 'application/x-msdownload');
      const resExe = mediaService.validateFile(invalidExe);
      testRuns.push({
        name: 'Penolakan Format Tidak Didukung (.exe)',
        category: 'error',
        passed: !resExe.valid,
        message: !resExe.valid
          ? 'File tidak didukung berhasil ditolak secara aman.'
          : 'File tidak didukung lolos validasi.',
      });

      // 3. Duplicate Detection Test
      const dummyItem: MediaItem = {
        id: 'test-dup-1',
        name: 'sample_duplicate.mp4',
        path: '/videos/sample_duplicate.mp4',
        type: 'video',
        extension: 'mp4',
        size: 5000,
        lastModified: 1700000000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const duplicateFile = new File([new Blob(['x'])], 'sample_duplicate.mp4', {
        type: 'video/mp4',
        lastModified: 1700000000,
      });
      // Force match size
      Object.defineProperty(duplicateFile, 'size', { value: 5000 });
      const isDup = mediaService.isDuplicate(duplicateFile, [dummyItem]);
      testRuns.push({
        name: 'Deteksi Berkas Duplikat',
        category: 'service',
        passed: isDup === true,
        message: isDup ? 'Duplikat terdeteksi berdasarkan nama dan ukuran.' : 'Gagal mendeteksi duplikat.',
      });

      // 4. Media Store Add and Remove Test
      const testStoreItem: MediaItem = {
        id: `test-item-${Date.now()}`,
        name: 'Test_Automation_Clip.mp4',
        path: '/mock/Test_Automation_Clip.mp4',
        type: 'video',
        extension: 'mp4',
        size: 1048576,
        duration: 12.5,
        width: 1920,
        height: 1080,
        fps: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addMedia(testStoreItem);
      const retrieved = useMediaStore.getState().getMediaById(testStoreItem.id);
      const addPassed = retrieved !== undefined && retrieved.name === testStoreItem.name;
      testRuns.push({
        name: 'MediaStore: addMedia & getMediaById',
        category: 'store',
        passed: addPassed,
        message: addPassed ? 'Media berhasil disimpan dan dibaca dari store.' : 'Media tidak ditemukan di store.',
      });

      // 5. Search filtering test
      useMediaStore.getState().searchMedia('Automation');
      const searchResults = useMediaStore.getState().getMedia();
      const searchPassed = searchResults.some((i) => i.id === testStoreItem.id);
      testRuns.push({
        name: 'MediaStore: Real-time Search',
        category: 'store',
        passed: searchPassed,
        message: searchPassed ? 'Pencarian menemukan item berdasarkan kata kunci.' : 'Item tidak ditemukan via search.',
      });
      useMediaStore.getState().searchMedia(''); // reset

      // 6. Category filter test
      useMediaStore.getState().filterMedia('audio');
      const audioResults = useMediaStore.getState().getMedia();
      const filterPassed = !audioResults.some((i) => i.id === testStoreItem.id);
      testRuns.push({
        name: 'MediaStore: Category Filtering (Video vs Audio)',
        category: 'store',
        passed: filterPassed,
        message: filterPassed ? 'Filter menyaring hanya tipe yang sesuai.' : 'Filter gagal menyaring.',
      });
      useMediaStore.getState().filterMedia('all'); // reset

      // 7. Cleanup
      await removeMedia(testStoreItem.id);
      const afterRemove = useMediaStore.getState().getMediaById(testStoreItem.id);
      testRuns.push({
        name: 'MediaStore: removeMedia',
        category: 'store',
        passed: afterRemove === undefined,
        message: afterRemove === undefined ? 'Media berhasil dihapus dari store.' : 'Media masih ada setelah dihapus.',
      });
    } catch (e) {
      testRuns.push({
        name: 'General Test Runner Exception',
        category: 'error',
        passed: false,
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setResults(testRuns);
      setIsRunning(false);
    }
  };

  const handleInjectSampleMedia = async () => {
    const samples: MediaItem[] = [
      {
        id: `sample-video-${Date.now()}`,
        name: 'Nusantara_Archipelago_4K.mp4',
        path: 'C:/Videos/Nusantara_Archipelago_4K.mp4',
        type: 'video',
        extension: 'mp4',
        size: 145000000,
        duration: 45.2,
        width: 3840,
        height: 2160,
        fps: 60,
        codec: 'HEVC / H.265',
        thumbnail: mediaService.getFallbackThumbnail('video'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sample-audio-${Date.now()}`,
        name: 'Traditional_Gamelan_BGM.wav',
        path: 'C:/Audio/Traditional_Gamelan_BGM.wav',
        type: 'audio',
        extension: 'wav',
        size: 24500000,
        duration: 120.0,
        sampleRate: 48000,
        channels: 2,
        thumbnail: mediaService.getFallbackThumbnail('audio'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sample-image-${Date.now()}`,
        name: 'Borobudur_Sunrise_Poster.jpg',
        path: 'C:/Photos/Borobudur_Sunrise_Poster.jpg',
        type: 'image',
        extension: 'jpg',
        size: 4200000,
        width: 1920,
        height: 1080,
        thumbnail: mediaService.getFallbackThumbnail('image'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await useMediaStore.getState().addMultipleMedia(samples);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Phase 2 Media Library Test Suite"
      subtitle="Pengujian otomatis & verifikasi kepatuhan acceptance criteria"
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4 text-xs">
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Modul ini menjalankan pengujian unit otomatis terhadap MediaStore, MediaService,
          penanganan ekstensi file, deteksi duplikat, dan penolakan format yang tidak didukung.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Menjalankan Tes...' : 'Jalankan Seluruh Tes'}</span>
          </button>

          <button
            onClick={handleInjectSampleMedia}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1a2130] hover:bg-[#232c3f] border border-[#2b374e] text-slate-200 rounded-lg font-medium transition-colors"
            title="Tambahkan 3 sampel media (Video 4K, Audio WAV, Gambar Poster) ke Media Library"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Inject Sample Media</span>
          </button>
        </div>

        {/* Test Results Display */}
        {results.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-[#222836]">
            <div className="flex items-center justify-between font-semibold text-slate-300 text-[11px]">
              <span>Hasil Pengujian ({results.filter((r) => r.passed).length}/{results.length} Lolos)</span>
            </div>

            <div className="border border-[#222836] rounded-lg divide-y divide-[#1e2330] overflow-hidden max-h-60 overflow-y-auto bg-[#0e1017]">
              {results.map((res, i) => (
                <div key={i} className="p-2 flex items-start gap-2.5">
                  {res.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{res.name}</span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1 rounded ${
                          res.passed ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {res.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{res.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
