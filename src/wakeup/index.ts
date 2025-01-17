import dgram from 'react-native-udp';
import {Buffer} from '@craftzdog/react-native-buffer';
import {DiscoveryVersions, DiscoveryPort} from '../common';

const DDP_CLIENT_TYPE = 'vr';
const DDP_AUTH_TYPE = 'R';
const DDP_MODEL = 'w';
const DDP_APP_TYPE = 'r';

const BIND_PORT = 16690;

export const wakeup = (host: string, credential: string, isPS5 = true) => {
  const isIpv6 = host.indexOf(':') > 0;
  const socket = dgram.createSocket({
    type: isIpv6 ? 'udp6' : 'udp4',
    reusePort: true,
  });

  let isSocketClosed = false;

  socket.on('error', err => {
    console.log('Socket error:', err);
    if (!isSocketClosed) {
      isSocketClosed = true;
      socket.close();
    }
  });

  socket.once('listening', () => {
    const port = isPS5 ? DiscoveryPort.PS5 : DiscoveryPort.PS4;
    const ddpVersion = isPS5 ? DiscoveryVersions.PS5 : DiscoveryVersions.PS4;
    try {
      const msg =
        `WAKEUP * HTTP/1.1\n` +
        `client-type:${DDP_CLIENT_TYPE}\n` +
        `auth-type:${DDP_AUTH_TYPE}\n` +
        `model:${DDP_MODEL}\n` +
        `app-type:${DDP_APP_TYPE}\n` +
        `user-credential:${credential}\n` +
        `device-discovery-protocol-version:${ddpVersion}\n`;

      const message = Buffer.from(msg, 'utf-8');

      socket.send(message, 0, message.length, port, host, err => {
        if (err) {
          console.log('Send message error:', err);
          if (!isSocketClosed) {
            isSocketClosed = true;
            socket.close();
          }
        } else {
          console.log('Wakeup message sent successfully');
        }
      });

      setTimeout(() => {
        if (!isSocketClosed) {
          isSocketClosed = true;
          socket.close();
        }
      }, 2000);
    } catch (err) {
      console.log('Error in listening handler:', err);
      if (!isSocketClosed) {
        isSocketClosed = true;
        socket.close();
      }
    }
  });

  // Bind the socket
  try {
    socket.bind(BIND_PORT, '0.0.0.0');
  } catch (err) {
    console.log('Socket bind error:', err);
    if (!isSocketClosed) {
      isSocketClosed = true;
      socket.close();
    }
  }
};
