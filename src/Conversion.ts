export interface Conversion {
    amount: number;
    base: string;
    date: string;
    rates: Rates;
}
export interface Rates {
    USD: number;
}