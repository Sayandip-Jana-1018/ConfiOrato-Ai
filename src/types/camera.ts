export interface CameraSettingsType {
  deviceId: string;
  audioDeviceId: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
}
