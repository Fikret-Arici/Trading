const TradingView = require('./main');

/**
 * Kripto Para Takip Uygulaması
 * Gerçek zamanlı fiyat takibi
 */

console.log('🚀 Kripto Para Takip Uygulaması Başlatılıyor...\n');

const client = new TradingView.Client();
const chart = new client.Session.Chart();

// Takip edilecek kripto paralar
const cryptos = [
  { symbol: 'BINANCE:BTCEUR', name: 'Bitcoin/Euro', emoji: '₿' },
  { symbol: 'BINANCE:ETHEUR', name: 'Ethereum/Euro', emoji: 'Ξ' },
  { symbol: 'BINANCE:ADAEUR', name: 'Cardano/Euro', emoji: '₳' },
  { symbol: 'BINANCE:DOTEUR', name: 'Polkadot/Euro', emoji: '●' },
  { symbol: 'BINANCE:SOLEUR', name: 'Solana/Euro', emoji: '◎' }
];

let currentIndex = 0;
let priceData = {};

// Kripto para değiştirme fonksiyonu
function switchCrypto() {
  if (currentIndex >= cryptos.length) {
    currentIndex = 0;
  }
  
  const crypto = cryptos[currentIndex];
  console.log(`\n🔄 ${crypto.emoji} ${crypto.name} yükleniyor...`);
  
  chart.setMarket(crypto.symbol, {
    timeframe: '1', // 1 dakikalık
    range: 1, // Son 1 gün
  });
}

// Hata dinleyicisi
chart.onError((...err) => {
  console.error('❌ Hata:', ...err);
});

// Sembol yüklendiğinde
chart.onSymbolLoaded(() => {
  const crypto = cryptos[currentIndex];
  console.log(`✅ ${crypto.emoji} ${crypto.name} yüklendi!`);
  console.log(`💰 Para Birimi: ${chart.infos.currency_id}`);
  console.log(`📊 Piyasa Durumu: ${chart.infos.session_regular ? 'Açık' : 'Kapalı'}`);
  console.log('─'.repeat(50));
});

// Fiyat güncellemelerini dinle
chart.onUpdate(() => {
  if (!chart.periods[0]) return;
  
  const crypto = cryptos[currentIndex];
  const currentPrice = chart.periods[0].close;
  const currentTime = new Date().toLocaleTimeString('tr-TR');
  
  // Fiyat verilerini kaydet
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
  
  // Son 10 fiyatı tut
  if (data.prices.length > 10) {
    data.prices = data.prices.slice(-10);
  }
  
  // Yüksek ve düşük değerleri güncelle
  if (currentPrice > data.high) data.high = currentPrice;
  if (currentPrice < data.low) data.low = currentPrice;
  
  // Fiyat değişimini hesapla
  let priceChange = 0;
  let priceChangePercent = 0;
  
  if (data.lastPrice) {
    priceChange = currentPrice - data.lastPrice;
    priceChangePercent = (priceChange / data.lastPrice) * 100;
  }
  
  data.lastPrice = currentPrice;
  
  // Emoji seç
  let changeEmoji = '➡️';
  if (priceChange > 0) changeEmoji = '📈';
  else if (priceChange < 0) changeEmoji = '📉';
  
  // Fiyat bilgilerini göster
  console.log(`${changeEmoji} ${crypto.emoji} ${crypto.name}`);
  console.log(`   💰 Fiyat: ${currentPrice.toFixed(2)} ${chart.infos.currency_id}`);
  
  if (data.lastPrice && data.lastPrice !== currentPrice) {
    console.log(`   📊 Değişim: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)} (${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`);
  }
  
  console.log(`   📈 Günlük Yüksek: ${data.high.toFixed(2)} | 📉 Günlük Düşük: ${data.low.toFixed(2)}`);
  console.log(`   ⏰ Saat: ${currentTime}`);
  console.log('─'.repeat(50));
  
  // Önemli değişimleri vurgula
  if (Math.abs(priceChangePercent) > 2) {
    console.log(`🚨 ÖNEMLİ DEĞİŞİM! ${Math.abs(priceChangePercent).toFixed(2)}%`);
    console.log('─'.repeat(50));
  }
});

// Her 20 saniyede bir kripto para değiştir
setInterval(() => {
  currentIndex++;
  switchCrypto();
}, 20000);

// İlk kripto parayı yükle
switchCrypto();

// 1 dakika sonra özet göster
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

// 3 dakika sonra uygulamayı kapat
setTimeout(() => {
  console.log('\n🛑 Uygulama kapatılıyor...');
  chart.delete();
  client.end();
  console.log('✅ Uygulama kapatıldı');
}, 180000);

// Ctrl+C ile düzgün kapatma
process.on('SIGINT', () => {
  console.log('\n🛑 Kullanıcı tarafından durduruldu...');
  chart.delete();
  client.end();
  process.exit(0);
}); 