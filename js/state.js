export const state = {
  rows: [],
  map: {},
  fname: '',
  products: [],
  current: null,
  charts: {},
  currentPeriod: 30,
  selectedCategory: '',
  categorySortDesc: true,
  ritmoFilter: 'all',
  ritmoSortDesc: true,
  marketplace: null,        // 'shopee' | 'meli' | null
  _pendingOnSuccess: null,  // callback usado quando modal é fechado via confirmMap
};
