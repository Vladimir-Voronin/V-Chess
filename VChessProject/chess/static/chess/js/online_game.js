const chess_board_element = document.querySelector("#chessboard");

const notation_bind = new RightMenuBind(
    document.querySelector("#notation_button"),
    document.querySelector("#notation_container")
);
const play_bind = new RightMenuBind(
    document.querySelector("#play_menu_button"),
    document.querySelector("#play_container")
);
const players_bind = new RightMenuBind(
    document.querySelector("#players_button"),
    document.querySelector("#players_container")
);

const right_menu_view = new RightMenuView([notation_bind, play_bind, players_bind]);
const notation_view = new NotationView(
    document.querySelector("#notation_body")
);
const notation = new OnlineNotation(null, notation_view, online_game_socket);

chess_board = new ChessBoard(chess_board_element, path_to_pieces);
chess_board.create_board();

chess_game = new ChessGame(chess_board);
chess_game.notation = notation;

chess_game.set_figure_start_position(start_position,
    true, true, true, true
);
chess_game.start_game_from_current_position();

const move_next_button = document.querySelector("#next_move_button");
move_next_button.addEventListener("click", (e) => {
    click_next_move(e, chess_game);
});

const move_previous_button = document.querySelector("#previous_move_button");
move_previous_button.addEventListener("click", (e) => {
    click_previous_move(e, chess_game);
});

const move_last_main_line_button = document.querySelector("#last_main_line_move_button");
move_last_main_line_button.addEventListener("click", (e) => {
    click_last_main_line_move(e, chess_game);
});

const move_first_button = document.querySelector("#first_move_button");
move_first_button.addEventListener("click", (e) => {
    click_first_move(e, chess_game);
});

document.addEventListener("keydown", board_page_key_press);

function board_page_key_press(e) {
    if (e.key === "ArrowLeft") {
        click_previous_move(e, chess_game);
    }
    if (e.key === "ArrowRight") {
        click_next_move(e, chess_game);
    }
}
const flip_board_button = document.querySelector("#flip_board_button");
flip_board_button.addEventListener("click", (e) => {
    flip_board(chess_game.chess_board,
        document.querySelector("#user_bar_top"),
        document.querySelector("#user_bar_bottom"));
});

const test_button = document.querySelector("#test_button");
test_button.addEventListener("click", () => {
    $.ajax({
        type: "GET",
        url: url_ajax_return_new_html_test,
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            console.log(response);
            const right_container = document.querySelector(".right-container");
            right_container.innerHTML = response.new_right_container_html;
        },
        error: function (response) {
            console.log("error");
        }
    });
});

function update_game_from_server(chess_game, all_moves) {
    console.log("here");
    chess_game.notation.resume_main_line_with_uci_moves(chess_game, all_moves, path_to_pieces);
}

online_game_socket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    console.log(data);
    switch (data["type"]) {
        case "update_position":
            update_game_from_server(chess_game, data["all_moves"]);
            break;
        default:
            console.log("There is no such type of websocket message")
    }
};