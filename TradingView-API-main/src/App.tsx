import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './App.css'

interface PriceData {
  name: string
  emoji: string
  color: string
  prices: Array<{
    price: number
    time: string
    timestamp: number
  }>
  lastPrice: number | null
  high: number
  low: number
  currency: string
  lastUpdate: string
  priceChange: number
  priceChangePercent: number
}

interface PriceDataMap {
  [key: string]: PriceData
}

function App() {

  const [priceData, setPriceData] = useState<PriceDataMap>({})
  const [connected, setConnected] = useState(false)
  const [selectedCrypto, setSelectedCrypto] = useState<string>('')

  useEffect(() => {
    const newSocket = io('http://localhost:3000')
    
    newSocket.on('connect', () => {
      console.log('WebSocket bağlandı')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket bağlantısı kesildi')
      setConnected(false)
    })

    newSocket.on('priceData', (data: PriceDataMap) => {
      setPriceData(data)
      if (Object.keys(data).length > 0 && !selectedCrypto) {
        setSelectedCrypto(Object.keys(data)[0])
      }
    })

    newSocket.on('priceUpdate', ({ symbol, data }: { symbol: string, data: PriceData }) => {
      setPriceData(prev => ({
        ...prev,
        [symbol]: data
      }))
    })

    // Socket bağlantısı kuruldu

    return () => {
      newSocket.close()
    }
  }, [selectedCrypto])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('tr-TR')
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return '#10b981'
    if (change < 0) return '#ef4444'
    return '#6b7280'
  }

  const cryptoList = Object.entries(priceData)

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 Kripto Para Takip Uygulaması</h1>
        <div className="connection-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          {connected ? 'Bağlı' : 'Bağlantı Kesildi'}
        </div>
      </header>

      <div className="container">
        <div className="sidebar">
          <h2>Kripto Paralar</h2>
          <div className="crypto-list">
            {cryptoList.map(([symbol, data]) => (
              <div
                key={symbol}
                className={`crypto-item ${selectedCrypto === symbol ? 'selected' : ''}`}
                onClick={() => setSelectedCrypto(symbol)}
              >
                <div className="crypto-info">
                  <span className="crypto-emoji">{data.emoji}</span>
                  <span className="crypto-name">{data.name}</span>
                </div>
                {data.lastPrice && (
                  <div className="crypto-price">
                    <div className="price-value">{formatPrice(data.lastPrice)}</div>
                    <div 
                      className="price-change"
                      style={{ color: getChangeColor(data.priceChangePercent) }}
                    >
                      {data.priceChangePercent > 0 ? '+' : ''}{data.priceChangePercent.toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="main-content">
          {selectedCrypto && priceData[selectedCrypto] ? (
            <div className="chart-container">
              <div className="chart-header">
                <h2>
                  {priceData[selectedCrypto].emoji} {priceData[selectedCrypto].name}
                </h2>
                <div className="price-info">
                  <div className="current-price">
                    {formatPrice(priceData[selectedCrypto].lastPrice || 0)}
                  </div>
                  <div 
                    className="price-change-large"
                    style={{ color: getChangeColor(priceData[selectedCrypto].priceChangePercent) }}
                  >
                    {priceData[selectedCrypto].priceChangePercent > 0 ? '+' : ''}
                    {priceData[selectedCrypto].priceChangePercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Günlük Yüksek</div>
                  <div className="stat-value">{formatPrice(priceData[selectedCrypto].high)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Günlük Düşük</div>
                  <div className="stat-value">{formatPrice(priceData[selectedCrypto].low)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Son Güncelleme</div>
                  <div className="stat-value">{formatTime(priceData[selectedCrypto].lastUpdate)}</div>
                </div>
              </div>

              <div className="chart">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={priceData[selectedCrypto].prices}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(value) => formatTime(value)}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={['dataMin - 10', 'dataMax + 10']}
                      tickFormatter={(value) => formatPrice(value)}
                    />
                    <Tooltip 
                      labelFormatter={(value) => formatTime(value)}
                      formatter={(value: number) => [formatPrice(value), 'Fiyat']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke={priceData[selectedCrypto].color}
                      strokeWidth={2}
                      dot={false}
                      name="Fiyat"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="no-data">
              <h2>Veri bekleniyor...</h2>
              <p>Kripto para verileri yükleniyor, lütfen bekleyin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App 