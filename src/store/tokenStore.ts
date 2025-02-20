import {storage} from '../store/mmkv';
import type {UserInfo, PsnUsrtInfo} from '../types';

const STORE_KEY = 'user.tokenstore_v2';

export class TokenStore {
  userTokens: Array<UserInfo | PsnUsrtInfo> | [];

  constructor() {
    this.userTokens = [];
  }

  load() {
    let tokens = '[]';
    try {
      tokens = storage.getString(STORE_KEY) || '';
      if (!tokens) {
        tokens = '[]';
      }

      this.userTokens = JSON.parse(tokens);
    } catch {}

    return true;
  }

  getToken(): Array<UserInfo | PsnUsrtInfo> {
    return this.userTokens;
  }

  setToken(data: Array<UserInfo | PsnUsrtInfo>) {
    this.userTokens = data;
  }

  save() {
    const data = JSON.stringify(this.userTokens);

    // console.log('[TokenStore] save data:', data);
    storage.set(STORE_KEY, data);
  }

  clear() {
    try {
      storage.delete(STORE_KEY);
    } catch (e) {
      console.log('clear error: ', e);
    }

    this.userTokens = [];
  }
}
