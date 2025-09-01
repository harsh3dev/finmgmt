import { useQuery } from "@tanstack/react-query";

interface ExchangeRatesResponse {
  data: {
    [currency: string]: number;
  };
}

interface CurrencyConversionOptions {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  enabled?: boolean;
}

const fetchExchangeRates = async (baseCurrency: string): Promise<ExchangeRatesResponse> => {
  const response = await fetch(
    `/api/currency/exchange-rates?base_currency=${baseCurrency}&currencies=USD,EUR,GBP,JPY,CAD,AUD,CHF,CNY,INR,BRL`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch exchange rates`);
  }

  return response.json();
};

export const useCurrencyConversion = ({
  amount,
  fromCurrency,
  toCurrency,
  enabled = true,
}: CurrencyConversionOptions) => {
  const {
    data: exchangeRates,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["exchangeRates", fromCurrency],
    queryFn: () => fetchExchangeRates(fromCurrency),
    enabled: enabled && fromCurrency !== toCurrency,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours for exchange rates specifically
    retry: 3,
  });

  // If same currency, return original amount
  if (fromCurrency === toCurrency) {
    return {
      convertedAmount: amount,
      isLoading: false,
      error: null,
      isError: false,
      exchangeRate: 1,
    };
  }

  const exchangeRate = exchangeRates?.data?.[toCurrency];
  const convertedAmount = exchangeRate ? amount * exchangeRate : null;

  return {
    convertedAmount,
    isLoading,
    error,
    isError,
    exchangeRate,
  };
};

export const getCurrencySymbol = (currency: string): string => {
  const currencySymbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    CHF: "CHF",
    CNY: "¥",
    INR: "₹",
    BRL: "R$",
  };

  return currencySymbols[currency] || currency;
};

export const formatCurrencyValue = (
  amount: number | null,
  currency: string,
  decimalPlaces: number = 2
): string => {
  if (amount === null || amount === undefined) {
    return "N/A";
  }

  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(decimalPlaces)}`;
};

export const detectCurrencyFromData = (data: unknown): string => {
  // Convert data to string to search for currency indicators
  const dataString = JSON.stringify(data).toLowerCase();
  
  const currencyFields = ["currency", "curr", "symbol"];
  
  for (const field of currencyFields) {
    if (dataString.includes(field)) {
      const regex = new RegExp(`"${field}"\\s*:\\s*"([A-Z]{3})"`, "i");
      const match = dataString.match(regex);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
  }
  
  const commonCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "BRL"];
  for (const currency of commonCurrencies) {
    if (dataString.includes(currency.toLowerCase())) {
      return currency;
    }
  }
  
  return "USD";
};
