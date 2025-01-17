import dgram from 'react-native-udp';
import NetInfo from '@react-native-community/netinfo';

const DISCOVERY_PORT = 8888;
const MESSAGE_PORT = 8889;
const BROADCAST_ADDR = '255.255.255.255';

class Udp {
  constructor(isReceiver = false) {
    this.isReceiver = isReceiver;
    this.deviceId = Math.random().toString(36).substring(7);
    this.discoverySocket = null;
    this.messageSocket = null;
    this.discoveredDevices = new Map();
    this.onMessageReceived = null;
    this.onDeviceDiscovered = null;
    this.timer = null;
  }

  async getLocalIpAddress() {
    const networkInfo = await NetInfo.fetch();
    return networkInfo.details.ipAddress;
  }

  async init() {
    console.log('init');
    this.discoverySocket = dgram.createSocket({
      type: 'udp4',
      reusePort: true,
    });

    // 初始化消息传输socket
    this.messageSocket = dgram.createSocket({
      type: 'udp4',
      reusePort: true,
    });

    await this.discoverySocket.bind(DISCOVERY_PORT);

    if (this.isReceiver) {
      await this.messageSocket.bind(MESSAGE_PORT);
    } else {
      await this.messageSocket.bind(0);
    }

    this.discoverySocket.on('error', err => {
      console.error('Discovery socket error:', err);
    });

    this.messageSocket.on('error', err => {
      console.error('Message socket error:', err);
    });

    // 监听设备发现广播
    this.discoverySocket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        console.log('receive data:', data);

        if (data.type === 'DISCOVERY_REQUEST' && !this.isReceiver) {
          // 发送端收到接收端的寻找请求
          // 1. 记录接收端信息
          this.discoveredDevices.set(data.deviceId, {
            ip: rinfo.address,
            lastSeen: Date.now(),
          });

          // 2. 发送响应
          this.sendDiscoveryResponse(rinfo.address);

          // 3. 触发回调，通知上层发现了新设备
          if (this.onDeviceDiscovered) {
            const devicesArray = Array.from(
              this.discoveredDevices.entries(),
            ).map(([deviceId, deviceInfo]) => ({
              deviceId,
              ...deviceInfo,
            }));
            this.onDeviceDiscovered(devicesArray);
          }
        } else if (data.type === 'DISCOVERY_RESPONSE' && this.isReceiver) {
          // 接收端收到发送端的响应，可以记录发送端信息（如果需要的话）
          console.log('Received response from sender:', data.deviceId);
        }
      } catch (error) {
        console.error('Error parsing discovery message:', error);
      }
    });

    // 监听消息
    this.messageSocket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (
          data.type === 'MESSAGE' &&
          data.targetId === this.deviceId &&
          this.onMessageReceived
        ) {
          this.onMessageReceived(data.content, data.fromId);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // 如果是接收端，开始寻找发送端
    console.log('this.isReceiver:', this.isReceiver);
    if (this.isReceiver) {
      this.startDiscoveryBroadcast();
    }
  }

  startDiscoveryBroadcast() {
    console.log('startDiscoveryBroadcast');
    this.timer = setInterval(() => {
      console.log('send discovery request');
      const message = JSON.stringify({
        type: 'DISCOVERY_REQUEST',
        deviceId: this.deviceId,
      });
      console.log(
        'Sending discovery broadcast to:',
        BROADCAST_ADDR + ':' + DISCOVERY_PORT,
      );

      this.discoverySocket.send(
        message,
        0,
        message.length,
        DISCOVERY_PORT,
        BROADCAST_ADDR,
      );

      // 清理过期设备
      const now = Date.now();
      for (const [deviceId, device] of this.discoveredDevices.entries()) {
        if (now - device.lastSeen > 30000) {
          this.discoveredDevices.delete(deviceId);
        }
      }
    }, 5000);
  }

  // 新增：发送端响应发现请求
  sendDiscoveryResponse(targetIp) {
    const message = JSON.stringify({
      type: 'DISCOVERY_RESPONSE',
      deviceId: this.deviceId,
    });

    this.discoverySocket.send(
      message,
      0,
      message.length,
      DISCOVERY_PORT,
      targetIp,
    );
  }

  sendMessage(targetDeviceId, content) {
    const targetDevice = this.discoveredDevices.get(targetDeviceId);
    if (!targetDevice) {
      console.error('Target device not found');
      return false;
    }

    const message = JSON.stringify({
      type: 'MESSAGE',
      fromId: this.deviceId,
      targetId: targetDeviceId,
      content: content,
    });

    this.messageSocket.send(
      message,
      0,
      message.length,
      MESSAGE_PORT,
      targetDevice.ip,
    );
    return true;
  }

  setMessageCallback(callback) {
    this.onMessageReceived = callback;
  }

  setDeviceDiscoveryCallback(callback) {
    this.onDeviceDiscovered = callback;
  }

  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.discoverySocket) {
      this.discoverySocket.close();
    }
    if (this.messageSocket) {
      this.messageSocket.close();
    }
  }
}

export default Udp;
