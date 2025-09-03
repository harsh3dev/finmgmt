Trades - Last Price Updates
Stream real-time trades for US stocks, forex and crypto. Trades might not be available for some forex and crypto exchanges. In that case, a price update will be sent with volume = 0. A message can contain multiple trades. 1 API key can only open 1 connection at a time.

The following FX brokers do not support streaming: FXCM, Forex.com, FHFX. To get latest price for FX, please use the Forex Candles or All Rates endpoint.


Method: Websocket

Examples:

wss://ws.finnhub.io

Response Attributes:

type
Message type.

data
List of trades or price updates.

s
Symbol.

p
Last price.

t
UNIX milliseconds timestamp.

v
Volume.

c
List of trade conditions. A comprehensive list of trade conditions code can be found here



Sample code

Javascript
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
const socket = new WebSocket('wss://ws.finnhub.io?token=');

// Connection opened -> Subscribe
socket.addEventListener('open', function (event) {
    socket.send(JSON.stringify({'type':'subscribe', 'symbol': 'AAPL'}))
    socket.send(JSON.stringify({'type':'subscribe', 'symbol': 'BINANCE:BTCUSDT'}))
    socket.send(JSON.stringify({'type':'subscribe', 'symbol': 'IC MARKETS:1'}))
});

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
});

// Unsubscribe
 var unsubscribe = function(symbol) {
    socket.send(JSON.stringify({'type':'unsubscribe','symbol': symbol}))
}




Sample response
1
2
3
4
5
6
7
8
9
10
11
{
  "data": [
    {
      "p": 7296.89,
      "s": "BINANCE:BTCUSDT",
      "t": 1575526691134,
      "v": 0.011467
    }
  ],
  "type": "trade"
}
