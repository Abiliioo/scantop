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
  hist: 'ecompulse_net_eletrica_history_v3',
  snap: 'ecompulse_net_eletrica_active_v3',
  tab: 'ecompulse_net_eletrica_tab_v3',
  screen: 'ecompulse_screen_v4',
  theme: 'ecompulse_theme',
  fav: 'ecompulse_favorites_v4',
  accounts: 'ecompulse_accounts_v5',
  activeAccount: 'ecompulse_active_account_v5',
  period:      'ecompulse_revenue_period_v5',
  marketplace: 'ecompulse_marketplace_v1',
};

export const RHYTHM_LIMIT = 15;
export const MIN_IMAGES = 7;
export const TOP_PRODUCTS = 10;
export const MAX_COMPARE = 40;
