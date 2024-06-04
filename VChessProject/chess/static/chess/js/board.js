const chess_board_element = document.querySelector("#chessboard");

const notation_bind = new RightMenuBind(
    document.querySelector("#notation_button"),
    document.querySelector("#notation_container")
);
const play_bind = new RightMenuBind(
    document.querySelector("#play_button"),
    document.querySelector("#play_container")
);
const players_bind = new RightMenuBind(
    document.querySelector("#players_button"),
    document.querySelector("#players_container")
);

const right_menu_view = new RightMenuView([notation_bind, play_bind, players_bind]);
const notation_view = new NotationView(
    document.querySelector("#notation_body")
)

chess_board1 = new ChessBoard(chess_board_element, path_to_pieces);
chess_board1.create_board();

chess_game1 = new ChessGame(chess_board1);
chess_game1.notation_view = notation_view;

chess_game1.set_figure_start_position(start_position,
    true, true, true, true
);
chess_game1.start_game_from_current_position();

const move_next_button = document.querySelector("#next_move_button");
move_next_button.addEventListener("click", (e) => {
    click_next_move(e, chess_game1);
});

const move_previous_button = document.querySelector("#previous_move_button");
move_previous_button.addEventListener("click", (e) => {
    click_previous_move(e, chess_game1);
});

const move_last_main_line_button = document.querySelector("#last_main_line_move_button");
move_last_main_line_button.addEventListener("click", (e) => {
    click_last_main_line_move(e, chess_game1);
});

const move_first_button = document.querySelector("#first_move_button");
move_first_button.addEventListener("click", (e) => {
    click_first_move(e, chess_game1);
});

document.addEventListener("keydown", board_page_key_press);

function board_page_key_press(e) {
    if (e.key === "ArrowLeft") {
        click_previous_move(e, chess_game1);
    }
    if (e.key === "ArrowRight") {
        click_next_move(e, chess_game1);
    }
}
const flip_board_button = document.querySelector("#flip_board_button");
flip_board_button.addEventListener("click", (e) => {
    flip_board(chess_game1.chess_board,
        document.querySelector("#user_bar_top"),
        document.querySelector("#user_bar_bottom"));
});