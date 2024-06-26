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

const timer_white_view = new TimerView("#timer_white");
const timer_black_view = new TimerView("#timer_black");

const timer_white = new OnlineTimer(timer_white_view, full_time, additional_time_per_move);
const timer_black = new OnlineTimer(timer_black_view, full_time, additional_time_per_move)
timer_white.set_time_start();
timer_black.set_time_start();
chess_game = new ChessGame(chess_board, timer_white, timer_black);
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

function update_game_from_server(chess_game, all_moves, notation_view) {
    chess_game.notation.resume_main_line_with_uci_moves(chess_game, all_moves, path_to_pieces, notation_view);
}

function change_chess_board_block_access(chess_board, block_white, block_black) {
    chess_board.block_white = block_white;
    chess_board.block_black = block_black;
}

function raise_game_end_panel(is_draw, is_white_won, new_player_rating, rating_change) {
    const outer = document.createElement("div");
    outer.classList.add("end-game-panel-outer");
    const inner = document.createElement("div");
    inner.classList.add("end-game-panel-inner");
    const close_end_game_panel = document.createElement("div");
    close_end_game_panel.classList.add("close-end-game-panel");
    const span = document.createElement("span");
    const close_img = document.createElement("i");
    close_img.classList.add("fa-solid");
    close_img.classList.add("fa-square-xmark");
    const who_won_row = document.createElement("div");
    who_won_row.classList.add("who-won-row");
    const rating_change_row = document.createElement("div");
    rating_change_row.classList.add("rating-change-row");
    const new_rating = document.createElement("div");
    new_rating.classList.add("new-rating");
    const rating_change_elem = document.createElement("div");
    rating_change_elem.classList.add("rating-change");
    outer.append(close_end_game_panel);
    outer.append(inner);
    close_end_game_panel.append(span);
    span.append(close_img);
    inner.append(who_won_row);
    inner.append(rating_change_row);
    rating_change_row.append(new_rating);
    rating_change_row.append(rating_change_elem);
    if (is_draw) {
        who_won_row.innerHTML = "Draw";
    }
    else {
        if (is_white_won)
            who_won_row.innerHTML = "White won";
        else
            who_won_row.innerHTML = "Black won";
    }

    new_rating.innerHTML = new_player_rating;
    if (rating_change >= 0)
        rating_change_elem.innerHTML = "+" + String(rating_change);
    else
        rating_change_elem.innerHTML = String(rating_change);
    document.querySelector("#chessboard").append(outer);
}

let date_info = null;
online_game_socket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    switch (data["type"]) {
        case "update_position":
            update_game_from_server(chess_game, data["all_moves"], notation_view);
            const block_white = data["block_white"];
            const block_black = data["block_black"]
            change_chess_board_block_access(chess_board, block_white, block_black);
            const time_white_left = data["time_white_left"];
            const time_black_left = data["time_black_left"];
            timer_white.set_time(time_white_left);
            timer_black.set_time(time_black_left);
            const is_last_move_white = data["is_last_move_white"];
            if (is_last_move_white) {
                chess_game.timer_black.time_on_clock = time_black_left;
                chess_game.timer_black.last_move_time = new Date(data["last_move_datetime"]);
                chess_game.switch_timer_to_black();
            }
            if (!is_last_move_white) {
                chess_game.timer_white.time_on_clock = time_white_left;
                chess_game.timer_white.last_move_time = new Date(data["last_move_datetime"]);
                chess_game.switch_timer_to_white();
            }

            if (data["game_has_ended"]) {
                if (block_black) {
                    raise_game_end_panel(data["is_draw"], data["is_white_won"],
                        data["new_white_rating"], data["white_rating_change"]);
                }

                if (block_white) {
                    raise_game_end_panel(data["is_draw"], data["is_white_won"],
                        data["new_black_rating"], data["black_rating_change"]);
                }
            }

            break;
        case "flip_board_check":
            if (data["flip_board"]) {
                document.querySelector("#flip_board_button").click();
            }
            break;
        case "exception":
            console.log(`Exception type: ${data["exception_type"]}`);
            console.log(`Exception message: ${data["exception_message"]}`);
        default:
            console.log("There is no such type of websocket message")
    }
};
