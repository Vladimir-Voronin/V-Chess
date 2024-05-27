const chess_board_element = document.querySelector("#chessboard");

chess_board1 = new ChessBoard(chess_board_element, path_to_pieces);
chess_board1.create_board();

chess_game1 = new ChessGame(chess_board1);

chess_game1.set_figure_start_position(test_promotion,
    true, true, true, true
);
chess_game1.start_game_from_current_position();
