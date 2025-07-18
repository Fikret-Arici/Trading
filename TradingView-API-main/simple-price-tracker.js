const TradingView = require('./main');

/**
 * Basit Fiyat Takip Uygulaması
 * Çoklu kripto para takibi
 */

console.log('📊 Fiyat Takip Uygulaması Başlatılıyor...');

const client = new TradingView.Client();
const chart = new client.Session.Chart();

// Takip edilecek kripto paralar
const cryptos = [
  { symbol: 'BINANCE:BTCEUR', name: 'Bitcoin/Euro' },
  { symbol: 'BINANCE:ETHEUR', name: 'Ethereum/Euro' },
  { symbol: 'BINANCE:ADAEUR', name: 'Cardano/Euro' },
  { symbol: 'BINANCE:DOTEUR', name: 'Polkadot/Euro' }
];

let currentCryptoIndex = 0;
let priceHistory = {};

// İlk kripto parayı yükle
function loadNextCrypto() {
  if (currentCryptoIndex >= cryptos.length) {
    currentCryptoIndex = 0; // Başa dön
  }
  
  const crypto = cryptos[currentCryptoIndex];
  console.log(`\n🔄 ${crypto.name} yükleniyor...`);
  
  chart.setMarket(crypto.symbol, {
    timeframe: '5', // 5 dakikalık
    range: 1, // Son 1 gün
  });
}

// Hata dinleyicisi
chart.onError((...err) => {
  console.error('❌ Hata:', ...err);
});

// Sembol yüklendiğinde
chart.onSymbolLoaded(() => {
  const crypto = cryptos[currentCryptoIndex];
  console.log(`✅ ${crypto.name} yüklendi!`);
  console.log(`💰 Para Birimi: ${chart.infos.currency_id}`);
  console.log(`📈 Açılış: ${chart.infos.session_regular ? 'Düzenli' : 'Özel'}`);
});

// Fiyat güncellemelerini dinle
chart.onUpdate(() => {
  if (!chart.periods[0]) return;
  
  const crypto = cryptos[currentCryptoIndex];
  const currentPrice = chart.periods[0].close;
  const currentTime = new Date().toLocaleTimeString('tr-TR');
  
  // Fiyat geçmişini kaydet
  if (!priceHistory[crypto.symbol]) {
    priceHistory[crypto.symbol] = [];
  }
  
  const priceData = {
    time: currentTime,
    price: currentPrice,
    timestamp: Date.now()
  };
  
  priceHistory[crypto.symbol].push(priceData);
  
  // Son 5 fiyatı tut
  if (priceHistory[crypto.symbol].length > 5) {
    priceHistory[crypto.symbol] = priceHistory[crypto.symbol].slice(-5);
  }
  
  // Fiyat değişimini hesapla
  const previousPrice = priceHistory[crypto.symbol].length > 1 
    ? priceHistory[crypto.symbol][priceHistory[crypto.symbol].length - 2].price 
    : currentPrice;
  
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100);
  
  // Emoji seç
  let emoji = '➡️';
  if (priceChange > 0) emoji = '📈';
  else if (priceChange < 0) emoji = '📉';
  
  console.log(`${emoji} ${crypto.name}: ${currentPrice.toFixed(2)} ${chart.infos.currency_id} (${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`);
  
  // Önemli fiyat değişimlerini vurgula
  if (Math.abs(priceChangePercent) > 1) {
    console.log(`🚨 ÖNEMLİ DEĞİŞİM! ${Math.abs(priceChangePercent).toFixed(2)}%`);
  }
});

// Her 30 saniyede bir kripto para değiştir
setInterval(() => {
  currentCryptoIndex++;
  loadNextCrypto();
}, 30000);

// İlk kripto parayı yükle
loadNextCrypto();

// 2 dakika sonra özet göster
setTimeout(() => {
  console.log('\n📋 2 Dakika Özeti:');
  console.log('✅ Uygulama çalışıyor');
  console.log('📊 Çoklu kripto para takibi aktif');
  console.log('🔄 Otomatik kripto para değişimi aktif');
  console.log('\n📈 Fiyat Geçmişi:');
  
  Object.keys(priceHistory).forEach(symbol => {
    const crypto = cryptos.find(c => c.symbol === symbol);
    const prices = priceHistory[symbol];
    if (prices.length > 0) {
      const firstPrice = prices[0].price;
      const lastPrice = prices[prices.length - 1].price;
      const totalChange = ((lastPrice - firstPrice) / firstPrice) * 100;
      console.log(`${crypto.name}: ${firstPrice.toFixed(2)} → ${lastPrice.toFixed(2)} (${totalChange > 0 ? '+' : ''}${totalChange.toFixed(2)}%)`);
    }
  });
}, 120000);

// 5 dakika sonra uygulamayı kapat
setTimeout(() => {
  console.log('\n🛑 Uygulama kapatılıyor...');
  chart.delete();
  client.end();
  console.log('✅ Uygulama kapatıldı');
}, 300000);

// Ctrl+C ile düzgün kapatma
process.on('SIGINT', () => {
  console.log('\n🛑 Kullanıcı tarafından durduruldu...');
  chart.delete();
  client.end();
  process.exit(0);
}); 