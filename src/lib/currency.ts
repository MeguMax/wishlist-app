export const CURRENCIES = {
    UAH: { symbol: '₴', name: 'Гривна', flag: '🇺🇦' },
    USD: { symbol: '$', name: 'Доллар', flag: '🇺🇸' },
    EUR: { symbol: '€', name: 'Евро', flag: '🇪🇺' },
    RUB: { symbol: '₽', name: 'Рубль', flag: '🇷🇺' },
    PLN: { symbol: 'zł', name: 'Злотый', flag: '🇵🇱' },
    GBP: { symbol: '£', name: 'Фунт', flag: '🇬🇧' },
}

export type Currency = keyof typeof CURRENCIES

export function formatPrice(price: number | null, currency: string = 'UAH'): string {
    if (!price) return ''
    const curr = CURRENCIES[currency as Currency] || CURRENCIES.UAH
    return `≈ ${curr.symbol}${price.toLocaleString('uk-UA')}`
}
