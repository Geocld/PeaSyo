import {storage} from './mmkv';
import {debugFactory} from '../utils/debug';
const log = debugFactory('consolesStore');

const STORE_KEY = 'user.consoles';

export const saveConsoles = (consoles: any) => {
  log.info('saveConsoles:', JSON.stringify(consoles));

  storage.set(STORE_KEY, JSON.stringify(consoles));
};

export const deleteConsole = (consoleId: string) => {
  log.info('deleteConsole consoleId:', consoleId);
  let consoles: any = storage.getString(STORE_KEY);

  if (!consoles) {
    consoles = [];
  } else {
    try {
      consoles = JSON.parse(consoles);
    } catch (e) {
      consoles = [];
    }
  }

  let newConsoles: any[] = [];
  consoles.forEach((_console: any) => {
    if (_console.consoleId !== consoleId) {
      newConsoles.push(_console);
    }
  });

  storage.set(STORE_KEY, JSON.stringify(newConsoles));
};

export const getConsoles = (): any => {
  let consoles = storage.getString(STORE_KEY);
  if (!consoles) {
    return [];
  }
  try {
    const _consoles = JSON.parse(consoles);
    return _consoles;
  } catch {
    return [];
  }
};

export const cleanConsoles = () => {
  storage.set(STORE_KEY, JSON.stringify([]));
};
