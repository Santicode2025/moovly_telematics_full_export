export const detectCurrency = (): { code: string; symbol: string; locale: string } => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const country = locale.split("-")[1];
    
    const currencyMap: Record<string, { code: string; symbol: string; locale: string }> = {
      ZA: { code: "ZAR", symbol: "R", locale: "en-ZA" },
      GB: { code: "GBP", symbol: "£", locale: "en-GB" },
      US: { code: "USD", symbol: "$", locale: "en-US" },
      AU: { code: "AUD", symbol: "A$", locale: "en-AU" },
      CA: { code: "CAD", symbol: "C$", locale: "en-CA" },
      DE: { code: "EUR", symbol: "€", locale: "de-DE" },
      FR: { code: "EUR", symbol: "€", locale: "fr-FR" },
      NL: { code: "EUR", symbol: "€", locale: "nl-NL" },
      IT: { code: "EUR", symbol: "€", locale: "it-IT" },
      ES: { code: "EUR", symbol: "€", locale: "es-ES" },
    };
    
    return currencyMap[country] || currencyMap.ZA;
  } catch (error) {
    console.warn("Unable to detect currency, using default:", error);
    return { code: "ZAR", symbol: "R", locale: "en-ZA" };
  }
};

export const formatCurrency = (amount: number): string => {
  const currency = detectCurrency();
  
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
    }).format(amount);
  } catch (error) {
    console.warn("Currency formatting failed, using fallback:", error);
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  const currency = detectCurrency();
  
  try {
    return new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (error) {
    console.warn("Number formatting failed, using fallback:", error);
    return value.toFixed(decimals);
  }
};
