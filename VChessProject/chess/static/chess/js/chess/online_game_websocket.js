const id_regex = new RegExp("live\\/(\\d+)");
const game_id = id_regex.exec("http://127.0.0.1:8000/live/1")[1];

const chatSocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/game/'
    + game_id
    + '/'
);

chatSocket.onopen = function (e) {
    console.log("Websocket has been started");
}

chatSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    console.log(data);
};

chatSocket.onclose = function (e) {
    console.error('Chat socket closed unexpectedly');
};
