import { S } from './config.js';

export function ensureAccounts() {
  let list;
  try { list = JSON.parse(localStorage.getItem(S.accounts)) || []; }
  catch (e) { list = []; }
  if (!list.length) {
    list = [{ id: 'default', name: 'Minha loja' }];
    localStorage.setItem(S.accounts, JSON.stringify(list));
  }
  const activeId = localStorage.getItem(S.activeAccount);
  if (!activeId || !list.find(a => a.id === activeId)) {
    localStorage.setItem(S.activeAccount, list[0].id);
  }
  return list;
}

export function account() {
  const list = ensureAccounts();
  return list.find(a => a.id === localStorage.getItem(S.activeAccount)) || list[0];
}

export function accountName() { return account().name; }

export function accountKey(base) {
  const id = account().id;
  return id === 'default' || id === 'net-eletrica' ? base : base + '_' + id;
}

export function hist() {
  try { return JSON.parse(localStorage.getItem(accountKey(S.hist))) || []; }
  catch (e) { return []; }
}

export function saveHist(h) {
  localStorage.setItem(accountKey(S.hist), JSON.stringify(h));
}

export function favs() {
  try { return new Set(JSON.parse(localStorage.getItem(accountKey(S.fav))) || []); }
  catch (e) { return new Set(); }
}

export function saveFavs(set) {
  localStorage.setItem(accountKey(S.fav), JSON.stringify(Array.from(set)));
}

export function loadHistoryFor(id) {
  const key = (id === 'default' || id === 'net-eletrica') ? S.hist : S.hist + '_' + id;
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch (e) { return []; }
}
