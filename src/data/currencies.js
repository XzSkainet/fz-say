export const CURRENCIES = [
  // Grandes reservas / más negociadas
  { code: 'USD', name: 'Dólar Estadounidense', country: 'us', region: 'americas', symbol: '$' },
  { code: 'EUR', name: 'Euro', country: 'eu', region: 'europa', symbol: '€' },
  { code: 'JPY', name: 'Yen Japonés', country: 'jp', region: 'asia', symbol: '¥' },
  { code: 'GBP', name: 'Libra Esterlina', country: 'gb', region: 'europa', symbol: '£' },
  { code: 'CHF', name: 'Franco Suizo', country: 'ch', region: 'europa', symbol: 'Fr' },
  { code: 'AUD', name: 'Dólar Australiano', country: 'au', region: 'oceania', symbol: 'A$' },
  { code: 'CAD', name: 'Dólar Canadiense', country: 'ca', region: 'americas', symbol: 'C$' },
  { code: 'CNY', name: 'Yuan Chino', country: 'cn', region: 'asia', symbol: '¥' },
  { code: 'HKD', name: 'Dólar de Hong Kong', country: 'hk', region: 'asia', symbol: 'HK$' },
  { code: 'NZD', name: 'Dólar Neozelandés', country: 'nz', region: 'oceania', symbol: 'NZ$' },
  { code: 'SGD', name: 'Dólar de Singapur', country: 'sg', region: 'asia', symbol: 'S$' },
  // Europa
  { code: 'SEK', name: 'Corona Sueca', country: 'se', region: 'europa', symbol: 'kr' },
  { code: 'NOK', name: 'Corona Noruega', country: 'no', region: 'europa', symbol: 'kr' },
  { code: 'DKK', name: 'Corona Danesa', country: 'dk', region: 'europa', symbol: 'kr' },
  { code: 'PLN', name: 'Esloti Polaco', country: 'pl', region: 'europa', symbol: 'zł' },
  { code: 'CZK', name: 'Corona Checa', country: 'cz', region: 'europa', symbol: 'Kč' },
  { code: 'HUF', name: 'Forinto Húngaro', country: 'hu', region: 'europa', symbol: 'Ft' },
  { code: 'RON', name: 'Leu Rumano', country: 'ro', region: 'europa', symbol: 'lei' },
  { code: 'ISK', name: 'Corona Islandesa', country: 'is', region: 'europa', symbol: 'kr' },
  { code: 'BGN', name: 'Lev Búlgaro', country: 'bg', region: 'europa', symbol: 'лв' },
  { code: 'TRY', name: 'Lira Turca', country: 'tr', region: 'europa', symbol: '₺' },
  // Américas
  { code: 'MXN', name: 'Peso Mexicano', country: 'mx', region: 'americas', symbol: '$' },
  { code: 'BRL', name: 'Real Brasileño', country: 'br', region: 'americas', symbol: 'R$' },
  // Asia
  { code: 'INR', name: 'Rupia India', country: 'in', region: 'asia', symbol: '₹' },
  { code: 'KRW', name: 'Won Surcoreano', country: 'kr', region: 'asia', symbol: '₩' },
  { code: 'AED', name: 'Dírham EAU', country: 'ae', region: 'asia', symbol: 'د.إ' },
  { code: 'THB', name: 'Baht Tailandés', country: 'th', region: 'asia', symbol: '฿' },
  { code: 'MYR', name: 'Ringgit Malayo', country: 'my', region: 'asia', symbol: 'RM' },
  { code: 'IDR', name: 'Rupia Indonesia', country: 'id', region: 'asia', symbol: 'Rp' },
  { code: 'PHP', name: 'Peso Filipino', country: 'ph', region: 'asia', symbol: '₱' },
  { code: 'ILS', name: 'Séquel Israelí', country: 'il', region: 'asia', symbol: '₪' },
  // África
  { code: 'ZAR', name: 'Rand Sudafricano', country: 'za', region: 'africa', symbol: 'R' },
]

export const REGIONS = [
  { id: 'all', label: 'Todas' },
  { id: 'americas', label: 'América' },
  { id: 'europa', label: 'Europa' },
  { id: 'asia', label: 'Asia' },
  { id: 'oceania', label: 'Oceanía' },
  { id: 'africa', label: 'África' },
]

// ISO numeric (3-digit string) → currency code
export const ISO_TO_CURRENCY = {
  '036': 'AUD', '076': 'BRL', '124': 'CAD', '156': 'CNY',
  '203': 'CZK', '208': 'DKK', '344': 'HKD', '348': 'HUF',
  '356': 'INR', '360': 'IDR', '352': 'ISK', '376': 'ILS',
  '392': 'JPY', '410': 'KRW', '458': 'MYR', '484': 'MXN',
  '554': 'NZD', '578': 'NOK', '608': 'PHP', '616': 'PLN',
  '642': 'RON', '702': 'SGD', '710': 'ZAR', '752': 'SEK',
  '756': 'CHF', '764': 'THB', '784': 'AED', '792': 'TRY',
  '100': 'BGN', '826': 'GBP', '840': 'USD',
  // Eurozone
  '040': 'EUR', '056': 'EUR', '196': 'EUR', '233': 'EUR',
  '246': 'EUR', '250': 'EUR', '276': 'EUR', '300': 'EUR',
  '372': 'EUR', '380': 'EUR', '428': 'EUR', '440': 'EUR',
  '442': 'EUR', '470': 'EUR', '528': 'EUR', '620': 'EUR',
  '703': 'EUR', '705': 'EUR', '724': 'EUR',
}
