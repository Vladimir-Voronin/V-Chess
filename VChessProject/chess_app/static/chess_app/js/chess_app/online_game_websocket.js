const id_regex = new RegExp("live\\/(\\d+)");
const game_id = id_regex.exec(window.location.href)[1];

const online_game_socket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/game/'
    + game_id
    + '/'
);

online_game_socket.onopen = function (e) {
    console.log("Websocket has been started");
}

online_game_socket.onclose = function (e) {
    console.error('Websocket closed unexpectedly');
};
