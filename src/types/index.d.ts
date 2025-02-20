import {DiscoveryVersions, DeviceStatus, DeviceType} from '../common';

export type UserInfo = {
  is_default: boolean;
  scopes: string; // eg: "psn:clientapp",
  expiration: string; // eg: "2021-03-21T15:19:42.198Z",
  client_id: string; // as passed in,
  dcim_id: string; // some kind of UUID,
  grant_type: string; // eg: "authorization_code",
  user_id: string; // a number, This is important for streaming auth
  user_uuid: string; // a UUID,
  online_id: string; // aka username,
  country_code: string; // eg: "US",
  language_code: string; // eg: "en",
  community_domain: string; // eg: "a6",
  is_sub_account: boolean;
  account_id?: string; // Final encode user id
};

export type PsnUsrtInfo = {
  is_default: boolean;
  account_id: string; // Final encode user id
  online_id: string;
  user_id: string;
};

export type RegistedInfo = {
  apBssid: string; // eg: 123456789
  apKey: string;
  apName: string; // eg: PS5
  apSsid: string;
  rpKey: string; // base64 string, used for connect
  rpRegistKey: string; // // base64 string, used for connect
  serverMac: string;
  serverNickname: string; // eg: PS5-885
};

export type DeviceAddress = {
  address: string; // eg. 192.168.100.111
  port: number; // eg. 9302
  family: 'IPv4' | 'IPv6';
};

export type DiscoveryVersion =
  (typeof DiscoveryVersions)[keyof typeof DiscoveryVersions];

export type DiscoveredDevice = {
  address: DeviceAddress;
  hostRequestPort: number;

  extras: Record<string, string>;

  discoveryVersion: DiscoveryVersion;
  systemVersion: string;
  id: string;
  name: string;
  status: DeviceStatus;
  type: DeviceType;
};
