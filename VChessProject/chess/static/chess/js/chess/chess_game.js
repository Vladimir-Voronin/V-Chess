// making chess board
class ChessBoard {
    constructor(chess_board_element) {
        this.chess_board_element = chess_board_element
        this.coord_square_dict = {};
    }

    create_board() {
        const square_width = this.chess_board_element.clientWidth / 8;
        const column_coord = "abcdefgh";
        const row_coord = "12345678";
        for (let i = 0; i < 8; ++i) {
            for (let k = 0; k < 8; ++k) {
                const new_square = document.createElement("div");
                new_square.classList.add("chess-square");
                if ((i + k) % 2 !== 0) {
                    new_square.classList.add("dark-square");
                }
                else {
                    new_square.classList.add("light-square");
                }
                new_square.style.width = String(square_width) + "px";
                new_square.style.height = String(square_width) + "px";
                new_square.setAttribute("square-id", column_coord[k] + row_coord[7 - i]);
                this.chess_board_element.append(new_square);
                this.coord_square_dict[new_square.getAttribute("square-id")] = new_square;
            }
        }

        const all_squares = document.querySelectorAll("#chessboard .chess-square");

        all_squares.forEach(square => {
            square.addEventListener('mousedown', squareMouseDown);
            square.addEventListener('mouseover', squareMouseOver);
            square.addEventListener('mouseout', squareMouseOut);
        })
    }

    add_piece_element(figure_element, coord) {
        const square_element = this.coord_square_dict[coord];
        square_element.innerHTML = figure_element;
    }

    remove_piece_element(coord) {
        const square_element = this.coord_square_dict[coord];
        square_element.innerHTML = null;
    }
}

class ChessGame {
    constructor(chess_board) {
        this.chess_board = chess_board;
        this.current_position = null;
        this.move_turn_white = true;
        this.available_moves_dict = {};
        this.is_white_0_0_possible = true;
        this.is_white_0_0_0_possible = true;
        this.is_black_0_0_possible = true;
        this.is_black_0_0_0_possible = true;
    }
    
    set_figure_start_position(position,
        is_white_0_0_possible = false,
        is_white_0_0_0_possible = false,
        is_black_0_0_possible = false,
        is_black_0_0_0_possible = false
    ) {
        this.current_position = position
        this.is_white_0_0_possible = is_white_0_0_possible;
        this.is_white_0_0_0_possible = is_white_0_0_0_possible;
        this.is_black_0_0_possible = is_black_0_0_possible;
        this.is_black_0_0_0_possible = is_black_0_0_0_possible;
        for (var [key, value] of Object.entries(this.current_position)) {
            this.chess_board.add_piece_element(value.element, key);
        }
    }

    start_game_from_current_position(white_to_move = true) {
        this.move_turn_white = white_to_move;
        this._update_available_moves();
    }

    make_move(initial_square, move_square) {
        if (this.available_moves_dict[initial_square].has(move_square)) {
            // check for castles availability
            this._castle_possible_check(initial_square,);
            if (this._is_move_castle(initial_square, move_square)) {
                this._make_castle(initial_square, move_square);
            }

            const current_piece = this.current_position[initial_square];
            this.current_position = this._make_new_position(initial_square, move_square);

            this.chess_board.remove_piece_element(initial_square);
            this.chess_board.add_piece_element(current_piece.element, move_square);

            this.move_turn_white = !this.move_turn_white;
            this._update_available_moves();
        }
    }

    _update_available_moves() {
        this.available_moves_dict = {}

        // get all available leads from geometry rules
        for (var [square_coord, piece] of Object.entries(this.current_position)) {
            if (piece.is_white === this.move_turn_white) {
                this.available_moves_dict[square_coord] = piece.get_available_moves(square_coord,
                    this.current_position)
                this._update_available_moves_for_castle(square_coord, piece);
            }
        }

        console.log("Available now: ", this.available_moves_dict);

        // exclude leads that leads to check. O(n**2) FUTURE: Optimize.
        for (var [initial_square, move_square_set] of Object.entries(this.available_moves_dict)) {
            move_square_set.forEach(move_square => {
                let squares_under_attack_after_move = new Set();
                const new_position = this._make_new_position(initial_square, move_square);

                for (var [square_coord, piece] of Object.entries(new_position)) {
                    if (piece.is_white !== this.move_turn_white) {
                        squares_under_attack_after_move = squares_under_attack_after_move.union(
                            piece.get_available_moves(square_coord,
                                new_position))
                    }
                }

                const king_position = this._find_king_position(new_position, this.move_turn_white);
                if (squares_under_attack_after_move.has(king_position)) {
                    console.log(`You can't go from ${initial_square} to ${move_square}, because of check`)
                    this.available_moves_dict[initial_square].delete(move_square);
                }
            });
        }

        // get all squares under attack
        let squares_under_attack = new Set();
        for (var [square_coord, piece] of Object.entries(this.current_position)) {
            if (piece.is_white === !this.move_turn_white) {
                squares_under_attack = squares_under_attack.union(piece.get_available_moves(square_coord,
                    this.current_position));
            }
        }
        this._exclude_castle_if_under_check(squares_under_attack)

    }

    _exclude_castle_if_under_check(squares_under_attack) {
        const king_position = this._find_king_position(this.current_position, this.move_turn_white);
        console.log(king_position);
        if (squares_under_attack.has(get_square_coord_shift(king_position, 1, 0) ||
        squares_under_attack.has(get_square_coord_shift(king_position, 2, 0)))) {
            console.log("Yes 1");
            console.log(squares_under_attack);
            this.available_moves_dict[king_position].delete(get_square_coord_shift(king_position, 2, 0))
        }
    }

    _update_available_moves_for_castle(square_coord, piece) {
        if (piece instanceof King && this.move_turn_white) {
            const result = piece.get_castle_moves(square_coord,
                this.current_position,
                this.is_white_0_0_possible,
                this.is_white_0_0_0_possible
            );

            this.available_moves_dict[square_coord] = this.available_moves_dict[square_coord].union(result);
        }
        else if (piece instanceof King && !this.move_turn_white) {
            const result = piece.get_castle_moves(square_coord,
                this.current_position,
                this.is_black_0_0_possible,
                this.is_black_0_0_0_possible
            );
            this.available_moves_dict[square_coord] = this.available_moves_dict[square_coord].union(result);
        }
    }

    _castle_possible_check(initial_square) {
        if (this.move_turn_white) {
            if (initial_square === "e1") {
                this.is_white_0_0_possible = false;
                this.is_white_0_0_0_possible = false;
            }
            else if (initial_square === "a1")
                this.is_white_0_0_0_possible = false;
            else if (initial_square === "h1")
                this.is_white_0_0_possible = false;
        }
        if (!this.move_turn_white) {
            if (initial_square === "e8") {
                this.is_black_0_0_possible = false;
                this.is_black_0_0_0_possible = false;
            }
            else if (initial_square === "a8")
                this.is_black_0_0_0_possible = false;
            else if (initial_square === "h8")
                this.is_black_0_0_possible = false;
        }
    }

    _make_castle(initial_square, move_square) {
        if (move_square.charCodeAt(0) - initial_square.charCodeAt(0) === 2) {
            const rook_square = get_square_coord_shift(initial_square, 3, 0);
            const rook_after_castle_square = get_square_coord_shift(initial_square, 1, 0)
            const rook_piece = this.current_position[rook_square];
            this.chess_board.remove_piece_element(rook_square);
            this.chess_board.add_piece_element(rook_piece.element, rook_after_castle_square);
            this.current_position = this._make_new_position(rook_square, rook_after_castle_square);
        }
        else {
            const rook_square = get_square_coord_shift(initial_square, -4, 0);
            const rook_after_castle_square = get_square_coord_shift(initial_square, -1, 0)
            const rook_piece = this.current_position[rook_square];
            this.chess_board.remove_piece_element(rook_square);
            this.chess_board.add_piece_element(rook_piece.element, rook_after_castle_square);
            this.current_position = this._make_new_position(rook_square, rook_after_castle_square);
        }
    }

    _is_move_castle(initial_square, move_square) {
        if (this.current_position[initial_square] instanceof King) {
            if (Math.abs(initial_square.charCodeAt(0) - move_square.charCodeAt(0)) === 2) {
                return true;
            }
        }
        return false;
    }

    _make_new_position(initial_square, move_square) {
        const save_piece = this.current_position[initial_square];
        const new_position = {};
        for (var [square_coord, piece] of Object.entries(this.current_position)) {
            new_position[square_coord] = piece;
        }

        delete new_position[initial_square];
        new_position[move_square] = save_piece;
        return new_position;
    }

    _find_king_position(position, is_white) {
        for (var [key, value] of Object.entries(position)) {
            if (value instanceof King) {
                if (value.is_white === is_white)
                    return key;
            }
        }
    }
}
