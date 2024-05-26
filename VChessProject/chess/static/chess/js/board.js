const chess_board_element = document.querySelector("#chessboard");

chess_board = new ChessBoard(chess_board_element);
chess_board.create_board();

chess_game = new ChessGame(chess_board);

chess_game.set_figure_start_position(start_position,
    true, true, true, true
);
chess_game.start_game_from_current_position();
