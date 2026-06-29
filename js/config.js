// Mapeamento exato de colunas por marketplace
export const MARKETPLACE_MAPS = {
  shopee: {
    name:    'Nome',
    id:      'ID',
    price:   'Preço',
    rev:     'Receita Últimos 30 dias',
    units:   'Vendas Últimos 30 dias',
    trend:   'Tendência de vendas Últimos 30 dias',
    clip:    'Clips',
    cat:     'Categoria',
    images:  'Imagens',
    reviews: 'Avaliações',
    rating:  'Classificação',
  },
  meli: {
    name:    'Nome',
    id:      'ID',
    price:   'Preço',
    rev:     'Receita média mensal',
    units:   'Vendas médias mensais',
    cat:     'Categoria',
    images:  'Imagens',
    reviews: 'Avaliações',
    rating:  'Classificação',
    // trend e clip não existem no relatório MELI
  },
};

export const MARKETPLACE_LABELS = {
  shopee: 'Shopee',
  meli:   'Mercado Livre',
};

export const S = {
  hist:          'scantop_history_v1',
  snap:          'scantop_snap_v1',
  tab:           'scantop_tab_v1',
  screen:        'scantop_screen_v1',
  theme:         'scantop_theme',
  fav:           'scantop_favorites_v1',
  accounts:      'scantop_accounts_v1',
  activeAccount: 'scantop_active_account_v1',
  period:        'scantop_period_v1',
  marketplace:   'scantop_marketplace_v1',
};

export const RHYTHM_LIMIT = 15;
export const MIN_IMAGES = 7;
export const TOP_PRODUCTS = 10;
export const MAX_COMPARE = 40;
