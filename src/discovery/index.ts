import dgram from 'react-native-udp';
import {Buffer} from '@craftzdog/react-native-buffer';
import {parseMessage, formatDiscoveryMessage} from './message';
import {
  DeviceStatus,
  DeviceType,
  DiscoveryVersions,
  DiscoveryPort,
} from '../common';
import type {DeviceAddress, DiscoveryVersion} from '../types';

const BROADCAST_ADDRESS = '255.255.255.255';

export interface IDiscoveredDevice {
  address: DeviceAddress;
  hostRequestPort: number;
  discoveryVersion: DiscoveryVersion;
  systemVersion: string;
  id: string;
  name: string;
  status: DeviceStatus;
  type: DeviceType;
}

export const discoverDevices = (
  isPS5: boolean,
): Promise<IDiscoveredDevice[]> => {
  console.log('discoverDevices calling...')
  return new Promise((resolve, reject) => {
    const version = isPS5 ? DiscoveryVersions.PS5 : DiscoveryVersions.PS4;
    const port = isPS5 ? DiscoveryPort.PS5 : DiscoveryPort.PS4;

    const socket = dgram.createSocket({
      type: 'udp4',
      reusePort: true,
    });

    let devices: IDiscoveredDevice[] = [];
    let isSocketClosed = false;

    socket.on('error', err => {
      // console.log('Socket error:', err);
      if (!isSocketClosed) {
        isSocketClosed = true;
        socket.close();
      }
      reject(err);
    });

    socket.on('message', (buffer: Buffer, rinfo: any) => {
      try {
        const parsed: any = parseMessage(buffer);

        const device: IDiscoveredDevice = {
          address: rinfo,
          hostRequestPort: parseInt(parsed['host-request-port'], 10),
          discoveryVersion:
            (parsed['device-discovery-protocol-version'] as DiscoveryVersion) ??
            version,
          systemVersion: parsed['system-version'],
          id: parsed['host-id'],
          name: parsed['host-name'],
          status: parsed.status as DeviceStatus,
          type: parsed['host-type'] as DeviceType,
        };

        devices.push(device);
      } catch (err) {
        console.log('Failed to parse message:', err);
        reject(err);
      }
    });

    // Bind the socket
    try {
      socket.bind(0, () => {
        console.log('Discovery UDP socket bound successfully');
        socket.setBroadcast(true);
        const message = formatDiscoveryMessage({
          type: 'SRCH',
          version,
        });

        socket.send(
          message,
          0,
          message.length,
          port,
          BROADCAST_ADDRESS,
          err => {
            if (err) {
              // console.log('Send message error:', err);
              if (!isSocketClosed) {
                isSocketClosed = true;
                socket.close();
              }
              reject(err);
            } else {
              console.log('Discovery message sent successfully');
            }
          },
        );

        // Set timeout to close socket and resolve promise
        setTimeout(() => {
          if (!isSocketClosed) {
            isSocketClosed = true;
            socket.close();
          }
          resolve(devices);
        }, 2000);
      });
    } catch (err) {
      console.log('Discovery Socket bind error:', err);
      if (!isSocketClosed) {
        isSocketClosed = true;
        socket.close();
      }
      reject(err);
    }
  });
};
