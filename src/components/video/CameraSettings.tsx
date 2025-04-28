import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { CameraSettingsType } from '@/types/camera';
import { HiRefresh, HiX } from 'react-icons/hi';

const resolutions = [
  { label: '1080p (1920x1080)', width: 1920, height: 1080 },
  { label: '720p (1280x720)', width: 1280, height: 720 },
  { label: '480p (854x480)', width: 854, height: 480 },
  { label: '360p (640x360)', width: 640, height: 360 },
];

const frameRates = [60, 30, 24, 15];

export default function CameraSettings({ isOpen, onClose, settings, onApply }: { isOpen: boolean; onClose: () => void; settings: CameraSettingsType; onApply: (settings: CameraSettingsType) => void }) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      setDevices(videoDevices);
      setAudioDevices(audioDevices);

      // Set default devices if not already set
      if (!settings.deviceId && videoDevices.length > 0) {
        onApply({ ...settings, deviceId: videoDevices[0].deviceId });
      }
      if (!settings.audioDeviceId && audioDevices.length > 0) {
        onApply({ ...settings, audioDeviceId: audioDevices[0].deviceId });
      }
    } catch (error) {
      console.error('Error getting devices:', error);
      setPreviewError('Failed to enumerate devices. Please check browser permissions.');
    }
  };

  const updatePreview = async () => {
    try {
      // Clear previous error
      setPreviewError(null);

      // Stop existing preview
      stopPreview();

      if (!settings.videoEnabled) {
        setPreviewStream(null);
        return;
      }

      // Request new stream with retries
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: settings.deviceId ? { exact: settings.deviceId } : undefined,
              width: { ideal: settings.resolution.width },
              height: { ideal: settings.resolution.height },
              frameRate: { ideal: settings.frameRate }
            },
            audio: false // No audio needed for preview
          });

          // Set new stream
          setPreviewStream(stream);

          // Update video element
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            return; // Success, exit retry loop
          }
        } catch (error: any) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw error; // Throw on final retry
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error: any) {
      console.error('Error starting preview:', error);
      const errorMessage = error.name === 'NotAllowedError' 
        ? 'Camera access denied. Please check your browser permissions.'
        : error.name === 'NotFoundError'
        ? 'No camera found. Please connect a camera and try again.'
        : error.message || 'Failed to start camera preview';
      setPreviewError(errorMessage);
      setPreviewStream(null);
    }
  };

  const stopPreview = () => {
    if (previewStream) {
      previewStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setPreviewStream(null);
    setPreviewError(null);
  };

  const handleApply = () => {
    // Stop preview before applying settings
    stopPreview();
    onApply(settings);
    onClose();
  };

  // Initialize devices when modal opens
  useEffect(() => {
    if (isOpen) {
      getDevices();
    }
  }, [isOpen]);

  // Update preview when settings change
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        updatePreview();
      }, 500); // Debounce preview updates
      return () => clearTimeout(timeoutId);
    }
  }, [settings, isOpen]);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="glass-card relative w-full max-w-2xl p-6 text-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Camera Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close settings"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/60">Preview</h3>
            <div className="relative h-[300px] w-[300px] aspect-video rounded-lg overflow-hidden bg-black/50">
              {previewStream && settings.videoEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/30">
                  {previewError || (settings.videoEnabled ? 'No camera signal' : 'Camera disabled')}
                </div>
              )}
            </div>
            {/* Refresh button */}
            <button
              onClick={updatePreview}
              className="w-full py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <HiRefresh className="w-4 h-4" />
              Refresh Preview
            </button>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Camera</label>
              <div className="flex gap-2">
                <select
                  value={settings.deviceId}
                  onChange={e => onApply({ ...settings, deviceId: e.target.value })}
                  className="glass-dropdown flex-1"
                >
                  {devices.map(device => (
                    <option 
                      key={device.deviceId} 
                      value={device.deviceId}
                    >
                      {device.label || `Camera ${device.deviceId.slice(0, 4)}`}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onApply({ ...settings, videoEnabled: !settings.videoEnabled })}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    settings.videoEnabled
                      ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                      : 'bg-white/10 border-white/20 text-white/60'
                  }`}
                  aria-label={settings.videoEnabled ? 'Disable camera' : 'Enable camera'}
                >
                  {settings.videoEnabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Resolution</label>
              <select
                value={`${settings.resolution.width}x${settings.resolution.height}`}
                onChange={e => {
                  const [width, height] = e.target.value.split('x').map(Number);
                  onApply({ ...settings, resolution: { width, height } });
                }}
                className="glass-dropdown w-full"
              >
                {resolutions.map(res => (
                  <option 
                    key={res.label} 
                    value={`${res.width}x${res.height}`}
                  >
                    {res.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Frame Rate</label>
              <select
                value={settings.frameRate}
                onChange={e => onApply({ ...settings, frameRate: Number(e.target.value) })}
                className="glass-dropdown w-full"
              >
                {frameRates.map(fps => (
                  <option key={fps} value={fps}>
                    {fps} FPS
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Microphone</label>
              <div className="flex gap-2">
                <select
                  value={settings.audioDeviceId}
                  onChange={e => onApply({ ...settings, audioDeviceId: e.target.value })}
                  className="glass-dropdown flex-1"
                >
                  {audioDevices.map(device => (
                    <option 
                      key={device.deviceId} 
                      value={device.deviceId}
                    >
                      {device.label || `Microphone ${device.deviceId.slice(0, 4)}`}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onApply({ ...settings, audioEnabled: !settings.audioEnabled })}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    settings.audioEnabled
                      ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                      : 'bg-white/10 border-white/20 text-white/60'
                  }`}
                  aria-label={settings.audioEnabled ? 'Disable microphone' : 'Enable microphone'}
                >
                  {settings.audioEnabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );
}
