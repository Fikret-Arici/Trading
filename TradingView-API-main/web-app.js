const TradingView = require('./main');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Statik dosyaları serve et (React build dosyaları için)
app.use(express.static(path.join(__dirname, 'dist')));

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Tüm route'ları React uygulamasına yönlendir
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// TradingView istemcisi
const client = new TradingView.Client();
const chart = new client.Session.Chart();

// Takip edilecek kripto paralar
const cryptos = [
  { symbol: 'BINANCE:BTCEUR', name: 'Bitcoin/Euro', emoji: '₿', color: '#f7931a' },
  { symbol: 'BINANCE:ETHEUR', name: 'Ethereum/Euro', emoji: 'Ξ', color: '#627eea' },
  { symbol: 'BINANCE:ADAEUR', name: 'Cardano/Euro', emoji: '₳', color: '#0033ad' },
  { symbol: 'BINANCE:DOTEUR', name: 'Polkadot/Euro', emoji: '●', color: '#e6007a' },
  { symbol: 'BINANCE:SOLEUR', name: 'Solana/Euro', emoji: '◎', color: '#14f195' }
];

let currentCryptoIndex = 0;
let priceData = {};
let connectedClients = 0;

// WebSocket bağlantıları
io.on('connection', (socket) => {
  connectedClients++;
  console.log(`📱 Yeni kullanıcı bağlandı. Toplam: ${connectedClients}`);
  
  // Mevcut verileri gönder
  socket.emit('priceData', priceData);
  
  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`📱 Kullanıcı ayrıldı. Toplam: ${connectedClients}`);
  });
});

// Kripto para değiştirme fonksiyonu
function switchCrypto() {
  if (currentCryptoIndex >= cryptos.length) {
    currentCryptoIndex = 0;
  }
  
  const crypto = cryptos[currentCryptoIndex];
  console.log(`🔄 ${crypto.emoji} ${crypto.name} yükleniyor...`);
  
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
  const crypto = cryptos[currentCryptoIndex];
  console.log(`✅ ${crypto.emoji} ${crypto.name} yüklendi!`);
});

// Fiyat güncellemelerini dinle
chart.onUpdate(() => {
  if (!chart.periods[0]) return;
  
  const crypto = cryptos[currentCryptoIndex];
  const currentPrice = chart.periods[0].close;
  const currentTime = new Date();
  
  // Fiyat verilerini kaydet
  if (!priceData[crypto.symbol]) {
    priceData[crypto.symbol] = {
      name: crypto.name,
      emoji: crypto.emoji,
      color: crypto.color,
      prices: [],
      lastPrice: null,
      high: currentPrice,
      low: currentPrice,
      currency: chart.infos.currency_id
    };
  }
  
  const data = priceData[crypto.symbol];
  data.prices.push({
    price: currentPrice,
    time: currentTime.toISOString(),
    timestamp: currentTime.getTime()
  });
  
  // Son 50 fiyatı tut
  if (data.prices.length > 50) {
    data.prices = data.prices.slice(-50);
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
  data.lastUpdate = currentTime.toISOString();
  data.priceChange = priceChange;
  data.priceChangePercent = priceChangePercent;
  
  // WebSocket ile veriyi gönder
  io.emit('priceUpdate', {
    symbol: crypto.symbol,
    data: data
  });
  
  console.log(`${crypto.emoji} ${crypto.name}: ${currentPrice.toFixed(2)} ${chart.infos.currency_id} (${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`);
});

// Her 15 saniyede bir kripto para değiştir
setInterval(() => {
  currentCryptoIndex++;
  switchCrypto();
}, 15000);

// İlk kripto parayı yükle
switchCrypto();

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Web sunucusu http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`📊 Kripto para takip uygulaması başlatıldı`);
  console.log(`📱 Web arayüzüne erişmek için tarayıcınızda http://localhost:${PORT} adresini açın`);
});

// Ctrl+C ile düzgün kapatma
process.on('SIGINT', () => {
  console.log('\n🛑 Sunucu kapatılıyor...');
  chart.delete();
  client.end();
  server.close();
  process.exit(0);
}); 