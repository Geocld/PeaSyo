import {storage} from '../store/mmkv';
import type {UserInfo} from '../types';

const STORE_KEY = 'user.tokenstore';

export class TokenStore {
  userToken: UserInfo | null;

  constructor() {
    this.userToken = null;
  }

  load() {
    let tokens = '{}';
    try {
      tokens = storage.getString(STORE_KEY) || '';
      if (!tokens) {
        tokens = '{}';
      }

      this.userToken = JSON.parse(tokens);
    } catch {}

    return true;
  }

  getToken(): UserInfo | null {
    return this.userToken;
  }

  setToken(data: UserInfo) {
    this.userToken = data;
  }

  save() {
    const data = JSON.stringify(this.userToken);

    console.log('[TokenStore] save data:', data);
    storage.set(STORE_KEY, data);
  }

  clear() {
    try {
      storage.delete(STORE_KEY);
    } catch (e) {
      console.log('clear error: ', e);
    }

    this.userToken = null;
  }
}
