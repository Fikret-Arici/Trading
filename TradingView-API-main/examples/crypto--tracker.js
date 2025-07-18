const TradingView = require('../main');

console.log('🚀 Kripto Para Takip Uygulaması Başlatılıyor...\n');

const client = new TradingView.Client();
const chart = new client.Session.Chart();

// 💵 Dolar bazlı kripto paralar
const cryptos = [
  { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin/Dollar', emoji: '₿' },
  { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum/Dollar', emoji: 'Ξ' },
  { symbol: 'BINANCE:ADAUSDT', name: 'Cardano/Dollar', emoji: '₳' },
  { symbol: 'BINANCE:DOTUSDT', name: 'Polkadot/Dollar', emoji: '●' },
  { symbol: 'BINANCE:SOLUSDT', name: 'Solana/Dollar', emoji: '◎' }
];

let currentIndex = 0;
let priceData = {};

function switchCrypto() {
  if (currentIndex >= cryptos.length) {
    currentIndex = 0;
  }

  const crypto = cryptos[currentIndex];
  console.log(`\n🔄 ${crypto.emoji} ${crypto.name} yükleniyor...`);

  chart.setMarket(crypto.symbol, {
    timeframe: '1',
    range: 1,
  });
}

chart.onError((...err) => {
  console.error('❌ Hata:', ...err);
});

chart.onSymbolLoaded(() => {
  const crypto = cryptos[currentIndex];
  console.log(`✅ ${crypto.emoji} ${crypto.name} yüklendi!`);
  console.log(`💰 Para Birimi: ${chart.infos.currency_id}`);
  console.log(`📊 Piyasa Durumu: ${chart.infos.session_regular ? 'Açık' : 'Kapalı'}`);
  console.log('─'.repeat(50));
});

chart.onUpdate(() => {
  if (!chart.periods[0]) return;

  const crypto = cryptos[currentIndex];
  const currentPrice = chart.periods[0].close;
  const currentTime = new Date().toLocaleTimeString('tr-TR');

  if (!priceData[crypto.symbol]) {
    priceData[crypto.symbol] = {
      prices: [],
      lastPrice: null,
      high: currentPrice,
      low: currentPrice
    };
  }

  const data = priceData[crypto.symbol];
  data.prices.push({
    price: currentPrice,
    time: currentTime,
    timestamp: Date.now()
  });

  if (data.prices.length > 10) {
    data.prices = data.prices.slice(-10);
  }

  if (currentPrice > data.high) data.high = currentPrice;
  if (currentPrice < data.low) data.low = currentPrice;

  let priceChange = 0;
  let priceChangePercent = 0;

  if (data.lastPrice) {
    priceChange = currentPrice - data.lastPrice;
    priceChangePercent = (priceChange / data.lastPrice) * 100;
  }

  data.lastPrice = currentPrice;

  let changeEmoji = '➡️';
  if (priceChange > 0) changeEmoji = '📈';
  else if (priceChange < 0) changeEmoji = '📉';

  console.log(`${changeEmoji} ${crypto.emoji} ${crypto.name}`);
  console.log(`   💰 Fiyat: ${currentPrice.toFixed(2)} ${chart.infos.currency_id}`);
  if (data.lastPrice && data.lastPrice !== currentPrice) {
    console.log(`   📊 Değişim: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)} (${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`);
  }
  console.log(`   📈 Günlük Yüksek: ${data.high.toFixed(2)} | 📉 Günlük Düşük: ${data.low.toFixed(2)}`);
  console.log(`   ⏰ Saat: ${currentTime}`);
  console.log('─'.repeat(50));

  if (Math.abs(priceChangePercent) > 2) {
    console.log(`🚨 ÖNEMLİ DEĞİŞİM! ${Math.abs(priceChangePercent).toFixed(2)}%`);
    console.log('─'.repeat(50));
  }
});

setInterval(() => {
  currentIndex++;
  switchCrypto();
}, 20000);

switchCrypto();

setTimeout(() => {
  console.log('\n📋 1 Dakika Özeti:');
  console.log('✅ Uygulama çalışıyor');
  console.log('📊 Çoklu kripto para takibi aktif');
  console.log('🔄 Otomatik kripto para değişimi aktif');
  console.log('\n📈 Fiyat Özeti:');

  Object.keys(priceData).forEach(symbol => {
    const crypto = cryptos.find(c => c.symbol === symbol);
    const data = priceData[symbol];
    if (data.prices.length > 0) {
      const firstPrice = data.prices[0].price;
      const lastPrice = data.prices[data.prices.length - 1].price;
      const totalChange = ((lastPrice - firstPrice) / firstPrice) * 100;
      console.log(`${crypto.emoji} ${crypto.name}: ${firstPrice.toFixed(2)} → ${lastPrice.toFixed(2)} (${totalChange > 0 ? '+' : ''}${totalChange.toFixed(2)}%)`);
    }
  });
}, 60000);

setTimeout(() => {
  console.log('\n🛑 Uygulama kapatılıyor...');
  chart.delete();
}, 180000);
