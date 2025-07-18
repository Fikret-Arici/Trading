const TradingView = require('./main');

/**
 * Basit Trading Bot Örneği
 * Bitcoin/Euro için RSI ve Bollinger Bands stratejisi
 */

console.log('🤖 Trading Bot Başlatılıyor...');

const client = new TradingView.Client(); // WebSocket istemcisi oluştur
const chart = new client.Session.Chart(); // Grafik oturumu başlat

// Bitcoin/Euro piyasasını ayarla
chart.setMarket('BINANCE:BTCEUR', {
  timeframe: '15', // 15 dakikalık
  range: 1, // Son 1 gün
});

// Hata dinleyicisi
chart.onError((...err) => {
  console.error('❌ Grafik Hatası:', ...err);
});

// Sembol yüklendiğinde
chart.onSymbolLoaded(() => {
  console.log(`✅ Piyasa "${chart.infos.description}" yüklendi!`);
  console.log(`💰 Para Birimi: ${chart.infos.currency_id}`);
});

// RSI göstergesi oluştur
const rsiIndicator = new TradingView.BuiltInIndicator('RSI@tv-basicstudies-241');
const RSI = new chart.Study(rsiIndicator);

// Bollinger Bands göstergesi oluştur
const bbIndicator = new TradingView.BuiltInIndicator('BB@tv-basicstudies-241');
const BB = new chart.Study(bbIndicator);

let lastSignal = null;

// Fiyat güncellemelerini dinle
chart.onUpdate(() => {
  if (!chart.periods[0]) return;
  
  const currentPrice = chart.periods[0].close;
  const currentTime = new Date().toLocaleTimeString('tr-TR');
  
  console.log(`⏰ ${currentTime} - 💰 Fiyat: ${currentPrice} ${chart.infos.currency_id}`);
  
  // RSI ve BB değerlerini kontrol et
  if (RSI.graphic && BB.graphic) {
    const rsiValue = RSI.graphic.lastValue;
    const bbUpper = BB.graphic.upper && BB.graphic.upper.length > 0 ? BB.graphic.upper[BB.graphic.upper.length - 1] : null;
    const bbLower = BB.graphic.lower && BB.graphic.lower.length > 0 ? BB.graphic.lower[BB.graphic.lower.length - 1] : null;
    
    if (rsiValue) {
      console.log(`📊 RSI: ${rsiValue.toFixed(2)}`);
      
      if (bbUpper && bbLower) {
        console.log(`📊 BB Üst: ${bbUpper.toFixed(2)} | BB Alt: ${bbLower.toFixed(2)}`);
        
        // Trading sinyalleri
        let signal = null;
        
        // Aşırı satım sinyali (RSI < 30 ve fiyat BB alt bandının altında)
        if (rsiValue < 30 && currentPrice < bbLower) {
          signal = 'BUY';
        }
        // Aşırı alım sinyali (RSI > 70 ve fiyat BB üst bandının üstünde)
        else if (rsiValue > 70 && currentPrice > bbUpper) {
          signal = 'SELL';
        }
        
        // Sinyal değiştiyse göster
        if (signal && signal !== lastSignal) {
          console.log(`🚨 ${signal} SİNYALİ! 🚨`);
          console.log(`   RSI: ${rsiValue.toFixed(2)}`);
          console.log(`   Fiyat: ${currentPrice} ${chart.infos.currency_id}`);
          console.log(`   BB Üst: ${bbUpper.toFixed(2)} | BB Alt: ${bbLower.toFixed(2)}`);
          console.log('─'.repeat(50));
          lastSignal = signal;
        }
      } else {
        console.log('⏳ Bollinger Bands verisi yükleniyor...');
      }
    } else {
      console.log('⏳ RSI verisi yükleniyor...');
    }
  }
});

// RSI güncellemelerini dinle
RSI.onUpdate(() => {
  if (RSI.graphic && RSI.graphic.lastValue) {
    const rsiValue = RSI.graphic.lastValue;
    console.log(`📈 RSI Güncellendi: ${rsiValue.toFixed(2)}`);
  }
});

// Bollinger Bands güncellemelerini dinle
BB.onUpdate(() => {
  if (BB.graphic) {
    const upper = BB.graphic.upper[BB.graphic.upper.length - 1];
    const lower = BB.graphic.lower[BB.graphic.lower.length - 1];
    if (upper && lower) {
      console.log(`📊 BB Güncellendi - Üst: ${upper.toFixed(2)} | Alt: ${lower.toFixed(2)}`);
    }
  }
});

// 30 saniye sonra durumu özetle
setTimeout(() => {
  console.log('\n📋 30 Saniye Özeti:');
  console.log('✅ Bot çalışıyor ve veri alıyor');
  console.log('📊 RSI ve Bollinger Bands göstergeleri aktif');
  console.log('🚨 Trading sinyalleri izleniyor');
}, 30000);

// 2 dakika sonra botu kapat
setTimeout(() => {
  console.log('\n🛑 Bot kapatılıyor...');
  chart.delete();
  client.end();
  console.log('✅ Bot kapatıldı');
}, 120000);

// Ctrl+C ile düzgün kapatma
process.on('SIGINT', () => {
  console.log('\n🛑 Kullanıcı tarafından durduruldu...');
  chart.delete();
  client.end();
  process.exit(0);
}); 