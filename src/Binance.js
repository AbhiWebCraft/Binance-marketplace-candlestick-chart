import React, { useEffect, useRef, useState } from "react";
import { Chart } from "react-google-charts";
import ReconnectingWebSocket from "reconnecting-websocket";

const BinanceWebSocket = () => {
  const [coin, setCoin] = useState("ethusdt");
  const [interval, setInterval] = useState("1m");
  const [candlestickData, setCandlestickData] = useState([]);
  const [latestPrice, setLatestPrice] = useState(null); 

  const ws = useRef(null);
  const storedDataRef = useRef({}); 

  
  const storeData = (coin, data) => {
    localStorage.setItem(coin, JSON.stringify(data));
  };

  
  const retrieveData = (coin) => {
    const savedData = localStorage.getItem(coin);
    return savedData ? JSON.parse(savedData) : [];
  };

  
  const switchCoin = (selectedCoin) => {

    storeData(coin, candlestickData);
    storedDataRef.current[coin] = candlestickData;

    setCoin(selectedCoin);

    
    const previousData = storedDataRef.current[selectedCoin] || retrieveData(selectedCoin);
    setCandlestickData(previousData.length ? previousData : []); 
    setLatestPrice(null);   
  };

  
  const switchInterval = (selectedInterval) => {
    storeData(coin, candlestickData); 
    setInterval(selectedInterval);
    setCandlestickData([]); 
    setLatestPrice(null);  
  };

  useEffect(() => {

    const url = `wss://stream.binance.com:9443/ws/${coin}@kline_${interval}`;
    ws.current = new ReconnectingWebSocket(url);

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.k) {
        const candlestick = message.k;

        const newCandle = [
          new Date(candlestick.t),   
          parseFloat(candlestick.o), 
          parseFloat(candlestick.h), 
          parseFloat(candlestick.l), 
          parseFloat(candlestick.c), 
        ];

        setCandlestickData((prevData) => {
          if (prevData.length === 0 || prevData[prevData.length - 1][0].getTime() !== newCandle[0].getTime()) {
            const updatedData = [...prevData, newCandle];
            storeData(coin, updatedData); 
            return updatedData;
          }
          return prevData;
        });


        setLatestPrice(parseFloat(candlestick.c));
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [coin, interval]);

  
  const chartData = [
    ["Time", "Low", "Open", "Close", "High"],  
    ...candlestickData,  
  ];

  const chartOptions = {
    legend: "none",
    candlestick: {
      fallingColor: { strokeWidth: 0, fill: "#a52714" },
      risingColor: { strokeWidth: 0, fill: "#0f9d58" }, 
    },
    chartArea: { width: "90%", height: "70%" },
    hAxis: {
      format: 'HH:mm:ss', 
    },
  };

  return (
    <div className="p-4">
      <h2 className="text-center text-2xl font-bold mb-4 text-white">Binance Market Data</h2>

      {latestPrice && (
        <div className="text-center text-xl font-semibold mb-4 text-white">
          Latest {coin.toUpperCase()} Price: ${latestPrice.toFixed(2)}
        </div>
      )}

      <div className="flex justify-center mb-4">
        <select
          className="px-4 py-2 border rounded-md"
          value={coin}
          onChange={(e) => switchCoin(e.target.value)}
        >
          <option value="ethusdt">ETH/USDT</option>
          <option value="bnbusdt">BNB/USDT</option>
          <option value="dotusdt">DOT/USDT</option>
        </select>
      </div>

      <div className="flex justify-center mb-4">
        <select
          className="px-4 py-2 border rounded-md"
          value={interval}
          onChange={(e) => switchInterval(e.target.value)}
        >
          <option value="1m">1 Minute</option>
          <option value="3m">3 Minutes</option>
          <option value="5m">5 Minutes</option>
        </select>
      </div>

      <div className="w-full md:w-2/3 lg:w-1/2 mx-auto rounded-md">
        {candlestickData.length ? (
          <Chart
            chartType="CandlestickChart"
            width="100%"
            height="400px"
            data={chartData}
            options={chartOptions}
          />
        ) : (
          <p className="text-center text-white">Loading chart data...</p>
        )}
      </div>
    </div>
  );
};

export default BinanceWebSocket;
