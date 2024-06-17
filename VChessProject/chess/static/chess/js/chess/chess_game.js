class ChessBoard {
    constructor(chess_board_element, path_to_pieces) {
        this.chess_board_element = chess_board_element;
        this.path_to_pieces = path_to_pieces;
        this.coord_square_dict = {};
        this.chess_game = null;
        this.from_coord = null;
        this.to_coord = null;
        this.is_animation = false;
        this.square_from = null;
        this.square_over = null;
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
        var self = this
        const all_squares = document.querySelectorAll("#chessboard .chess-square");
        all_squares.forEach(square => {
            square.addEventListener('mousedown', function (e) {
                self.squareMouseDown(e);
            });
            square.addEventListener('mouseover', function (e) {
                self.squareMouseOver(e);
            });
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

    remove_all_pieces() {
        for (var [key, value] of Object.entries(this.coord_square_dict)) {
            this.remove_piece_element(key);
        }
    }

    squareMouseDown(e) {
        // check if game is still on
        if (this.chess_game.game_is_end) {
            return;
        }
        // check if square has a piece
        if (e.target.tagName !== "IMG")
            return false;
        this._remove_promote_buttons();
        const current_choosen_piece = e.target;

        // take the start coordinate of square
        this.square_from = current_choosen_piece.parentNode.parentNode;
        const current_square_id = this.square_from.getAttribute("square-id");
        // check if you may lead with this piece
        if (!(check_availability_to_move(current_square_id, this.chess_game)))
            return;

        addSquareShadow(this.square_from);
        this.from_coord = current_square_id

        showAvailableMovesHints(current_square_id, this.chess_game);

        // create a dummy of a piece for animation purpose
        const piece_dummy = current_choosen_piece.cloneNode();
        piece_dummy.classList.remove("piece-size");
        piece_dummy.classList.add("piece-dummy");
        piece_dummy.style.width = current_choosen_piece.clientWidth + "px";
        piece_dummy.style.height = current_choosen_piece.clientHeight + "px";

        // make real piece invisible when we drag its dummy
        current_choosen_piece.style.visibility = 'hidden';
        var self = this;
        document.onmousemove = function (e) {
            self.moveAt(piece_dummy, e);
        }
        document.body.append(piece_dummy);
        this.moveAt(piece_dummy, e);

        self = this;
        piece_dummy.onmouseup = function () {
            document.onmousemove = null;
            piece_dummy.onmouseup = null;
            piece_dummy.remove();
            if (self.square_over)
                self.to_coord = getSquareCoordinates(self.square_over);

            if (self.to_coord) {
                self.chess_game.make_move(self.from_coord, self.to_coord);
            }
            removeSquareShadow(self.square_from);
            removeSquareShadow(self.square_over);
            self.square_from = null;
            self.square_over = null;

            removeAvailableMovesHints(self.chess_game);

            // if lead - change location of a piece (FUTURE)
            current_choosen_piece.style.visibility = 'visible';

            self.is_animation = false;
        }

        piece_dummy.ondragstart = function () {
            return false;
        };
    }

    squareMouseOver(e) {
        // Takes out that 
        // if (e.target.tagName === "IMG") {
        //     if (!this.is_animation) {
        //         // Check if we can lead with this piece
        //         if ((check_availability_to_move(e.target.parentNode.parentNode.getAttribute("square-id"),
        //             this.chess_game)))
        //             e.target.style.cursor = 'grab';
        //     }
        // }
    }

    moveAt(dummy, e) {
        dummy.style.left = e.pageX - dummy.offsetWidth / 2 + 'px';
        dummy.style.top = e.pageY - dummy.offsetHeight / 2 + 'px';

        var elements = document.elementsFromPoint(e.pageX, e.pageY)
        let on_board_flag = false;
        elements.forEach(elem => {
            if (elem.classList.contains("chess-square")) {
                on_board_flag = true;
                if (elem !== this.square_over) {
                    if (this.square_over !== this.square_from)
                        removeSquareShadow(this.square_over);
                    this.square_over = elem;
                    addSquareShadow(this.square_over);
                }
            }
        });
        if (!on_board_flag) {
            removeSquareShadow(this.square_over);
            this.square_over = null;
            this.to_coord = null;
        }
    }

    create_promote_buttons(initital_square, move_square) {
        const is_white = move_square[1] === "8" ? true : false;
        const div_buttons_wrapper = document.createElement("div");
        div_buttons_wrapper.classList.add("div-buttons-wrapper");
        const queen_button = this._create_button(new Queen(null, null), is_white,
            initital_square, move_square);
        div_buttons_wrapper.appendChild(queen_button);
        const rook_button = this._create_button(new Rook(null, null), is_white,
            initital_square, move_square);
        div_buttons_wrapper.appendChild(rook_button);
        const knight_button = this._create_button(new Knight(null, null), is_white,
            initital_square, move_square);
        div_buttons_wrapper.appendChild(knight_button);
        const bishop_button = this._create_button(new Bishop(null, null), is_white,
            initital_square, move_square);
        div_buttons_wrapper.appendChild(bishop_button);
        document.body.append(div_buttons_wrapper);

        // move it to specific field
        const bodyRect = document.body.getBoundingClientRect();
        const elemRect = this.coord_square_dict[move_square].getBoundingClientRect();
        const centerX = elemRect.top - bodyRect.top;
        const centerY = elemRect.left - bodyRect.left;
        const offset = this.coord_square_dict[move_square].clientWidth / 2;
        div_buttons_wrapper.style.top = centerX + offset + "px";
        div_buttons_wrapper.style.left = centerY + offset + "px";

        if (is_white) {
            div_buttons_wrapper.style["flex-direction"] = "column"
        }
        else {
            div_buttons_wrapper.style["flex-direction"] = "column-reverse"
            div_buttons_wrapper.style.top = centerX + offset -
                4 * this.coord_square_dict[move_square].clientWidth + "px";
        }
    }

    _remove_promote_buttons() {
        const to_delete = document.getElementsByClassName('div-buttons-wrapper');

        while (to_delete[0]) {
            to_delete[0].parentNode.removeChild(to_delete[0]);
        }
    }

    _create_button(piece_class, is_white, initial_square, move_square) {
        const button = document.createElement("div");
        button.classList.add("chess-promoted-button");
        button.style.width = this.coord_square_dict["a1"].clientWidth + "px";
        button.style.height = this.coord_square_dict["a1"].clientHeight + "px";
        const piece = piece_class.return_basic_piece(this.path_to_pieces, is_white);
        button.innerHTML = piece.element;

        button.addEventListener("click", (function (e) {
            this._click_promotion_button(e, initial_square, move_square, is_white, piece.constructor.name);
        }).bind(this))
        return button;
    }

    _click_promotion_button(e, initial_square, move_square, is_white, piece_type) {
        const classes_dict = {
            "Queen": new Queen(null, null).return_basic_piece(this.path_to_pieces, is_white),
            "Rook": new Rook(null, null).return_basic_piece(this.path_to_pieces, is_white),
            "Knight": new Knight(null, null).return_basic_piece(this.path_to_pieces, is_white),
            "Bishop": new Bishop(null, null).return_basic_piece(this.path_to_pieces, is_white),
        }
        const promoted = classes_dict[piece_type];
        this.chess_game.make_move(initial_square, move_square,
            promoted);
        this._remove_promote_buttons();
    }
}

class ChessGame {
    constructor(chess_board) {
        this.chess_board = chess_board;
        this.chess_board.chess_game = this;
        this.current_position = null;
        this.move_turn_white = true;
        this.available_moves_dict = {};
        this.is_white_0_0_possible = true;
        this.is_white_0_0_0_possible = true;
        this.is_black_0_0_possible = true;
        this.is_black_0_0_0_possible = true;
        this.is_en_passant = false;
        this.en_passant_square = null;
        this.game_is_end = false;
        this.is_draw = false;
        this.white_won = false;
        this.all_positions_count = {};
        this.counter_50_moves_draw = 0;
        this.initial_notation_node = null;
        this.current_notation_node = null;
        this.notation = null;
    }

    set_figure_start_position(position,
        is_white_0_0_possible = false,
        is_white_0_0_0_possible = false,
        is_black_0_0_possible = false,
        is_black_0_0_0_possible = false,
        is_en_passant = false,
        en_passant_square = null,
        counter_50_moves_draw = 0
    ) {
        this.current_position = position;
        this.is_white_0_0_possible = is_white_0_0_possible;
        this.is_white_0_0_0_possible = is_white_0_0_0_possible;
        this.is_black_0_0_possible = is_black_0_0_possible;
        this.is_black_0_0_0_possible = is_black_0_0_0_possible;
        this.is_en_passant = is_en_passant;
        this.en_passant_square = en_passant_square;
        this.counter_50_moves_draw = counter_50_moves_draw;
        for (var [key, value] of Object.entries(this.current_position)) {
            this.chess_board.add_piece_element(value.element, key);
        }
    }

    start_game_from_current_position(white_to_move = true, update_position_counter = true) {
        if (!this.initial_notation_node) {
            this.initial_notation_node = new NotationNodeTree();
        }
        if (!this.current_notation_node)
            this.current_notation_node = this.initial_notation_node;
        if (update_position_counter)
            this._update_positions_counter();
        this.move_turn_white = white_to_move;
        this._update_available_moves();
        this.update_board();
        this._update_empty_notation();
    }

    _update_empty_notation() {
        this.current_notation_node.position_after = this.current_position;
        this.current_notation_node.initial_notation_node = this.initial_notation_node;
        this.current_notation_node.current_notation_node = this.current_notation_node;
        this.current_notation_node.is_white_0_0_possible = this.is_white_0_0_possible;
        this.current_notation_node.is_white_0_0_0_possible = this.is_white_0_0_0_possible;
        this.current_notation_node.is_black_0_0_possible = this.is_black_0_0_possible;
        this.current_notation_node.is_black_0_0_0_possible = this.is_black_0_0_0_possible;
        this.current_notation_node.counter_50_moves_draw = this.counter_50_moves_draw;
        this.current_notation_node.is_en_passant = this.is_en_passant;
        this.current_notation_node.en_passant_square = this.en_passant_square;
        this.current_notation_node.is_white = !this.move_turn_white;
        this.current_notation_node.all_positions_count = { ...this.all_positions_count };
    }

    make_move(initial_square, move_square, promoted_piece = null) {
        if (!this.available_moves_dict[initial_square].has(move_square)) {
            return;
        }

        const position_before_move = { ...this.current_position };
        // en passant handling
        this._update_if_en_passant(initial_square, move_square);
        this._en_passant_active_check_and_set(initial_square, move_square);
        const is_pawn_move = this.current_position[initial_square].constructor.name === "Pawn";
        const number_of_pieces_on_board = Object.keys(this.current_position).length;
        // Promotion
        if (this._is_trying_to_promote(initial_square, move_square)) {
            if (promoted_piece) {
                this.current_position = this._make_new_position(initial_square, move_square);
                this.current_position[move_square] = promoted_piece;
                this.chess_board.remove_piece_element(initial_square);
                this.chess_board.add_piece_element(promoted_piece.element, move_square);
            }
            else {
                this.chess_board.create_promote_buttons(initial_square, move_square);
                return;
            }
        }

        // notation update
        this._save_notation_node_before_move(initial_square, move_square,
            position_before_move);

        // check for castles availability
        this._castle_possible_check(initial_square, move_square);
        if (this._is_move_castle(initial_square, move_square)) {
            this._make_castle(initial_square, move_square);
        }

        // Current_position change
        const current_piece = this.current_position[initial_square];
        if (current_piece) {
            this.current_position = this._make_new_position(initial_square, move_square);

            this.chess_board.remove_piece_element(initial_square);
            this.chess_board.add_piece_element(current_piece.element, move_square);
        }

        const piece_has_been_eaten = number_of_pieces_on_board - Object.keys(this.current_position).length;

        this._update_positions_counter();
        this._update_50_moves_counter(is_pawn_move, piece_has_been_eaten);
        this.move_turn_white = !this.move_turn_white;
        this._update_available_moves();

        // notation final update
        this._save_notation_node_after_move(promoted_piece);
    }

    update_board() {
        this.chess_board.remove_all_pieces();
        for (var [key, value] of Object.entries(this.current_position)) {
            this.chess_board.add_piece_element(value.element, key);
        }
    }

    resume_game_from_notation_node(notation_node) {
        this.current_position = notation_node.position_after;
        this.is_white_0_0_possible = notation_node.is_white_0_0_possible;
        this.is_white_0_0_0_possible = notation_node.is_white_0_0_0_possible;
        this.is_black_0_0_possible = notation_node.is_black_0_0_possible;
        this.is_black_0_0_0_possible = notation_node.is_black_0_0_0_possible;
        this.is_en_passant = notation_node.is_en_passant;
        this.en_passant_square = notation_node.en_passant_square;
        this.all_positions_count = notation_node.all_positions_count;
        this.counter_50_moves_draw = notation_node.counter_50_moves_draw;
        this.initial_notation_node = notation_node.initial_notation_node;
        this.current_notation_node = notation_node.current_notation_node;
        this.move_turn_white = !notation_node.is_white;
        this.game_is_end = notation_node.game_is_end;
        this.is_draw = notation_node.is_draw;
        this.white_won = notation_node.white_won;

        this.start_game_from_current_position(this.move_turn_white, false);
    }

    _save_notation_node_before_move(initial_square, move_square, position_before_move) {
        const new_notation_node = new NotationNodeTree(this.current_notation_node);
        new_notation_node.set_node_prefix(initial_square, move_square,
            position_before_move, this.move_turn_white, this.available_moves_dict,
            this._is_pawn_try_to_eat_en_passant(initial_square, move_square)
        );
        this.current_notation_node.write_new_line(new_notation_node);
        this.current_notation_node = new_notation_node;
    }

    _save_notation_node_after_move(promoted_piece) {
        this.current_notation_node.set_node_suffix(
            this.current_position,
            this.is_white_0_0_possible,
            this.is_white_0_0_0_possible,
            this.is_black_0_0_possible,
            this.is_black_0_0_0_possible,
            this.is_en_passant,
            this.en_passant_square,
            this.all_positions_count,
            this.counter_50_moves_draw,
            this.initial_notation_node,
            this.current_notation_node,
            this.game_is_end,
            this.is_draw,
            this.white_won,
            promoted_piece
        );
        this.notation.write_new_node(this.current_notation_node, this);
    }

    _is_trying_to_promote(initial_square, move_square) {
        const target_square_check_suffix = this.move_turn_white ? "8" : "1";
        if (this.current_position[initial_square] instanceof Pawn &&
            move_square[1] === target_square_check_suffix
        ) {
            return true;
        }
        return false;
    }

    _is_valid_move(initial_square, move_square) {
        if (this.available_moves_dict[initial_square].has(move_square))
            return true;
        return false;
    }

    _update_available_moves() {
        this.available_moves_dict = {}
        // get all available leads from geometry rules
        for (var [square_coord, piece] of Object.entries(this.current_position)) {
            if (piece.is_white === this.move_turn_white) {
                this.available_moves_dict[square_coord] = piece.get_available_moves(square_coord,
                    this.current_position)
                this._update_available_moves_for_castle(square_coord, piece);
                this._update_available_moves_for_en_passant(square_coord, piece);
            }
        }

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
        this._check_end_game(squares_under_attack);
    }

    _check_end_game(squares_under_attack) {
        // Check if mate
        let number_of_available_moves = 0;
        for (var [initial_square, move_square_set] of Object.entries(this.available_moves_dict)) {
            move_square_set.forEach(move_square => {
                number_of_available_moves += 1;
            });
        }
        if (!number_of_available_moves) {
            // either mate or stalemate
            const king_position = this._find_king_position(this.current_position,
                this.move_turn_white);
            if (squares_under_attack.has(king_position)) {
                this._set_game_end(false, !this.move_turn_white);
                return;
            }
            else {
                this._set_game_end(true, null);
                return;
            }
        }

        // draw if not enough resources
        if (is_draw_not_enough_resources(this.current_position)) {
            this._set_game_end(true, null);
            return;
        }

        // Check for 3 time position repeat
        Object.values(this.all_positions_count).forEach(value => {
            if (value >= 3) {
                this._set_game_end(true, null);
                return;
            }
        })

        // Draw if 50 full-moves (100 half-moves) without eating and pawn leads
        if (this.counter_50_moves_draw >= 100) {
            this._set_game_end(true, null);
        }
    }

    _set_game_end(is_draw, white_won) {
        this.game_is_end = true;
        this.is_draw = is_draw;
        this.white_won = white_won;
        console.log("The game has ended");
        if (this.is_draw) {
            console.log("Result: Draw");
        }
        else if (this.white_won) {
            console.log("Result: White won")
        }
        else {
            console.log("Result: Black won");
        }
    }

    _update_50_moves_counter(is_pawn_move, piece_has_been_eaten) {
        if (is_pawn_move || piece_has_been_eaten) {
            this.counter_50_moves_draw = 0;
            return;
        }
        this.counter_50_moves_draw += 1;
    }

    _update_positions_counter() {
        if (this.current_notation_node.parent === null ||
            this.current_notation_node === this.current_notation_node.parent.children[0]
        ) {
            const position_string = create_string_from_position(this.current_position);
            if (position_string in this.all_positions_count) {
                this.all_positions_count[position_string] += 1
            }
            else {
                this.all_positions_count[position_string] = 1
            }
        }
    }

    _en_passant_active_check_and_set(initial_square, move_square) {
        if (this.current_position[initial_square] instanceof Pawn &&
            Math.abs(Number(move_square[1]) - Number(initial_square[1])) === 2) {
            this.is_en_passant = true;
            this.en_passant_square = initial_square[0] + String((Number(move_square[1]) +
                Number(initial_square[1])) / 2);
        }
        else {
            this.is_en_passant = false;
            this.en_passant_square = null;
        }
    }

    _exclude_castle_if_under_check(squares_under_attack) {
        const king_position = this._find_king_position(this.current_position, this.move_turn_white);
        if (squares_under_attack.has(get_square_coord_shift(king_position, 1, 0) ||
            squares_under_attack.has(get_square_coord_shift(king_position, 2, 0)))) {
            this.available_moves_dict[king_position].delete(get_square_coord_shift(king_position, 2, 0))
        }
        if (squares_under_attack.has(get_square_coord_shift(king_position, -1, 0) ||
            squares_under_attack.has(get_square_coord_shift(king_position, -2, 0)))) {
            this.available_moves_dict[king_position].delete(get_square_coord_shift(king_position, -2, 0))
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

    _update_available_moves_for_en_passant(square_coord, piece) {
        if (piece instanceof Pawn && this.is_en_passant) {
            const make_en_passant = piece.get_en_passant_move(square_coord, this.en_passant_square);
            if (make_en_passant)
                this.available_moves_dict[square_coord].add(make_en_passant);
        }
    }

    _update_if_en_passant(initial_square, move_square) {
        if (this._is_pawn_try_to_eat_en_passant(initial_square, move_square)) {

            const delete_piece_prefix = move_square[0];
            let delete_piece_square = null;
            if (move_square[1] === "3")
                delete_piece_square = delete_piece_prefix + "4";
            else
                delete_piece_square = delete_piece_prefix + "5";

            delete this.current_position[delete_piece_square];
            this.chess_board.remove_piece_element(delete_piece_square);
        }
    }

    _is_pawn_try_to_eat_en_passant(initial_square, move_square) {
        if (this.current_position[initial_square] instanceof Pawn &&
            !(move_square in this.current_position) &&
            initial_square[0] !== move_square[0])
            return true;
        return false;
    }

    _castle_possible_check(initial_square, move_square) {
        if (this.move_turn_white) {
            if (initial_square === "e1") {
                this.is_white_0_0_possible = false;
                this.is_white_0_0_0_possible = false;
            }
            else if (initial_square === "a1" || move_square === "a1")
                this.is_white_0_0_0_possible = false;
            else if (initial_square === "h1" || move_square === "h1")
                this.is_white_0_0_possible = false;
        }
        if (!this.move_turn_white) {
            if (initial_square === "e8") {
                this.is_black_0_0_possible = false;
                this.is_black_0_0_0_possible = false;
            }
            else if (initial_square === "a8" || move_square === "a8")
                this.is_black_0_0_0_possible = false;
            else if (initial_square === "h8" || move_square === "h8")
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

function flip_board(chess_board, top_user_bar_element, bottom_user_bar_element) {
    const save = top_user_bar_element.innerHTML;
    top_user_bar_element.innerHTML = "";
    top_user_bar_element.innerHTML = bottom_user_bar_element.innerHTML
    bottom_user_bar_element.innerHTML = "";
    bottom_user_bar_element.innerHTML = save;
    if (chess_board.chess_board_element.classList.contains("flip-chessboard")) {
        chess_board.chess_board_element.classList.remove("flip-chessboard");
    }
    else {
        chess_board.chess_board_element.classList.add("flip-chessboard");
    }
}
