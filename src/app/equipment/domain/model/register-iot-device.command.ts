import { IotDeviceType } from './iot-device-type';

/** Registration of an ESP32 device with the identity Edge uses to recognise it (US51, US53). */
export interface RegisterIotDeviceCommand {
  deviceType: IotDeviceType;
  name: string;
  /** Unique identifier with which Edge recognises the device. */
  sensorExternalId: string;
  /** MAC address or serial number. */
  serialNumber: string;
  model: string;
  firmwareVersion: string | null;
}
