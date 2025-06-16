// 지수이동평균 (EMA)
export function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  let emaArray = [];
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

  emaArray[period - 1] = ema;

  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    emaArray[i] = ema;
  }

  return emaArray;
}

// RSI
export function calculateRSI(data, period = 14) {
  let gains = 0, losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let rs = gains / (losses || 1);
  let rsi = [100 - 100 / (1 + rs)];

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) {
      gains = (gains * (period - 1) + diff) / period;
      losses = (losses * (period - 1)) / period;
    } else {
      gains = (gains * (period - 1)) / period;
      losses = (losses * (period - 1) - diff) / period;
    }

    rs = gains / (losses || 1);
    rsi.push(100 - 100 / (1 + rs));
  }

  return Array(period).fill(null).concat(rsi);
}

// MACD
export function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  const emaShort = calculateEMA(data, shortPeriod);
  const emaLong = calculateEMA(data, longPeriod);

  let macdLine = emaShort.map((val, idx) =>
    val !== undefined && emaLong[idx] !== undefined ? val - emaLong[idx] : null
  );

  let signalLineRaw = macdLine.filter(x => x !== null);
  let signalLine = calculateEMA(signalLineRaw, signalPeriod);
  signalLine = Array(macdLine.length - signalLine.length).fill(null).concat(signalLine);

  let histogram = macdLine.map((val, idx) =>
    val !== null && signalLine[idx] !== null ? val - signalLine[idx] : null
  );

  return { macdLine, signalLine, histogram };
}
