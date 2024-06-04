class NotationNodeTree {
    constructor(parent_node = null) {
        this.move_number = 0;
        this.notation_data = "";
        this.is_white = null;
        this.position_after = null;
        this.children = [];
        this.parent = parent_node;
        this.is_white_0_0_possible = null;
        this.is_white_0_0_0_possible = null;
        this.is_black_0_0_possible = null;
        this.is_black_0_0_0_possible = null;
        this.is_en_passant = false;
        this.en_passant_square = null;
        this.all_positions_count = {};
        this.counter_50_moves_draw = 0;
        this.initial_notation_node = null;
        this.current_notation_node = null;
        this.notation_element = null
    }

    set_node_prefix(initial_square,
        move_square,
        position_before_move,
        is_white,
        available_moves,
        is_eating_en_passant
    ) {
        this.is_white = is_white;

        if (this.parent) {
            if (this.is_white)
                this.move_number = this.parent.move_number + 1;
            else
                this.move_number = this.parent.move_number;
        }

        const piece_shortname_dict = get_piece_shortname_dict();
        const piece_type_full_name = position_before_move[initial_square].constructor.name;
        const piece_type_notation_name = piece_shortname_dict[piece_type_full_name];

        // check for castle
        if (piece_type_full_name === King.name) {
            if (initial_square === "e1" && move_square === "g1") {
                this.notation_data = "O-O";
                return;
            }
            if (initial_square === "e1" && move_square === "c1") {
                this.notation_data = "O-O-O";
                return;
            }
            if (initial_square === "e8" && move_square === "g8") {
                this.notation_data = "O-O";
                return;
            }
            if (initial_square === "e8" && move_square === "c8") {
                this.notation_data = "O-O-O";
                return;
            }
        }

        // Define if we need to point out initial square in PGN notation
        const squared_with_same_piece_type = [];
        for (var [square, piece] of Object.entries(position_before_move)) {
            if (piece.constructor.name === piece_type_full_name &&
                square !== initial_square &&
                piece.is_white === is_white) {
                squared_with_same_piece_type.push(square);
            }
        }
        let x_pointer = "";
        let y_pointer = "";
        squared_with_same_piece_type.forEach(square => {
            if (available_moves[square].has(move_square)) {
                if (initial_square[0] !== square[0]) {
                    x_pointer = initial_square[0];
                }
                else {
                    y_pointer = initial_square[1];
                }
            }
        })
        // means pawn try to eat. We nead to add x_pointer in this case, because of PGN structure
        if ((piece_type_full_name === Pawn.name && move_square in position_before_move) ||
            is_eating_en_passant) {
            x_pointer = initial_square[0];
        }

        // Check if we eat something. if yes: add "x"
        let eating_char = "";
        if (move_square in position_before_move || is_eating_en_passant) {
            eating_char = "x";
        }

        this.notation_data = piece_type_notation_name + x_pointer + y_pointer + eating_char + move_square;
    }

    set_node_suffix(position_after,
        is_white_0_0_possible,
        is_white_0_0_0_possible,
        is_black_0_0_possible,
        is_black_0_0_0_possible,
        is_en_passant,
        en_passant_square,
        all_positions_count,
        counter_50_moves_draw,
        initial_notation_node,
        current_notation_node,
        promoted_piece
    ) {
        this.position_after = { ...position_after };
        this.is_white_0_0_possible = is_white_0_0_possible;
        this.is_white_0_0_0_possible = is_white_0_0_0_possible;
        this.is_black_0_0_possible = is_black_0_0_possible;
        this.is_black_0_0_0_possible = is_black_0_0_0_possible;
        this.is_en_passant = is_en_passant;
        this.en_passant_square = en_passant_square;
        this.all_positions_count = { ...all_positions_count };
        this.counter_50_moves_draw = counter_50_moves_draw;
        this.initial_notation_node = initial_notation_node;
        this.current_notation_node = current_notation_node;

        if (promoted_piece) {
            const piece_shortname_dict = get_piece_shortname_dict();
            const shortname = piece_shortname_dict[promoted_piece.constructor.name];
            this.notation_data += "=" + shortname;
        }
    }

    write_main_line_next(node) {
        if (!this.children.length) {
            this.children.push(node);
        }
        else {
            this.children.unshift(node);
        }
    }

    write_new_line(node) {
        this.children.push(node);
    }
}

class NotationView {
    constructor(notation_element, current_highligted_node = null) {
        this.notation_element = notation_element;
        this.current_row_element = null;
        this.all_move_notation_elements = [];
        this.current_highligted_node = current_highligted_node;
    }

    write_new_node(notation_node, chess_game) {
        let is_main_line = false;
        let dummy = notation_node;
        while (dummy.parent !== null) {
            dummy = dummy.parent;
        }

        while (dummy.children.length > 0 && dummy.children[0] !== null) {
            dummy = dummy.children[0];
        }
        if (dummy === notation_node)
            is_main_line = true;

        // check if this branch already exists
        let element = null;
        let is_already_in_notation = false;
        for (let i = 0; i < notation_node.parent.children.length - 1; i++) {
            element = notation_node.parent.children[i];
            if (element.notation_data === notation_node.notation_data) {
                is_already_in_notation = true;
                break;
            }
        }
        if (is_already_in_notation) {
            notation_node = element;
            // Implement if lead the same as a main line
            this.on_notation_click(null, notation_node.notation_element,
                notation_node,
                chess_game);
            return;
        }

        if (is_main_line) {
            this.write_new_main_line(notation_node, chess_game);
        }
        else {
            if (notation_node.parent.children.length <= 1) {
                this.write_current_branch_line(notation_node, chess_game);
            }
            else {
                this.write_new_branch_line(notation_node, chess_game);
            }
        }
    }

    write_current_branch_line(notation_node, chess_game) {
        const parent_node = notation_node.parent;
        const row_before = parent_node.notation_element.parentElement;
        row_before.after(this.current_row_element);
        if (notation_node.is_white) {
            const move_number_branch_element = document.createElement("div");
            move_number_branch_element.classList.add("move-number-branch");
            move_number_branch_element.innerHTML = notation_node.move_number + "."
            this.current_row_element.append(move_number_branch_element);
        }
        const move_notation_branch_element = document.createElement("div");
        move_notation_branch_element.classList.add("move-notation-branch");
        move_notation_branch_element.setAttribute("is_white", notation_node.is_white);
        move_notation_branch_element.setAttribute("move_number", notation_node.move_number);
        move_notation_branch_element.innerHTML = notation_node.notation_data;

        this.current_row_element.append(move_notation_branch_element);
        move_notation_branch_element.addEventListener("click", ((e) => {
            this.on_notation_click(e, move_notation_branch_element, notation_node, chess_game);
        }).bind(this))
        this.all_move_notation_elements.push(move_notation_branch_element);
        notation_node.notation_element = move_notation_branch_element;
        this.make_notation_active(notation_node, move_notation_branch_element);
    }

    write_new_branch_line(notation_node, chess_game) {
        const new_row_branch = document.createElement("div");
        new_row_branch.classList.add("notation-row-branch");
        this.current_row_element = new_row_branch;
        const parent_node = notation_node.parent;
        let row_before;
        if (parent_node.notation_element) {
            row_before = parent_node.notation_element.parentElement;
            row_before.after(new_row_branch);
        }
        else {
            row_before = document.querySelector(".notation-row");
            row_before.after(new_row_branch);
        }

        const move_number_branch_element = document.createElement("div");
        move_number_branch_element.classList.add("move-number-branch");
        if (notation_node.is_white) {
            move_number_branch_element.innerHTML = notation_node.move_number + "."
        }
        else {
            move_number_branch_element.innerHTML = notation_node.move_number + " ..."
        }
        new_row_branch.append(move_number_branch_element);
        const move_notation_branch_element = document.createElement("div");
        move_notation_branch_element.classList.add("move-notation-branch");
        move_notation_branch_element.setAttribute("is_white", notation_node.is_white);
        move_notation_branch_element.setAttribute("move_number", notation_node.move_number);
        move_notation_branch_element.innerHTML = notation_node.notation_data;

        this.current_row_element.append(move_notation_branch_element);
        move_notation_branch_element.addEventListener("click", ((e) => {
            this.on_notation_click(e, move_notation_branch_element, notation_node, chess_game);
        }).bind(this))
        this.all_move_notation_elements.push(move_notation_branch_element);
        notation_node.notation_element = move_notation_branch_element;
        this.make_notation_active(notation_node, move_notation_branch_element);
    }

    write_new_main_line(notation_node, chess_game) {
        if (notation_node.is_white) {
            const new_row = create_new_main_row(notation_node);
            this.current_row_element = new_row;
            this.notation_element.append(this.current_row_element);
        }
        const move_notation = create_new_main_move_notation(notation_node);
        this.current_row_element.append(move_notation);
        move_notation.addEventListener("click", ((e) => {
            this.on_notation_click(e, move_notation, notation_node, chess_game);
        }).bind(this))
        this.all_move_notation_elements.push(move_notation);
        notation_node.notation_element = move_notation;
        this.make_notation_active(notation_node, move_notation);
    }

    on_notation_click(e, move_notation, notation_node, chess_game) {
        if (!move_notation) {
            this.current_row_element = null;
            this.all_move_notation_elements.forEach(elem => {
                elem.classList.remove("active");
            });
            this.current_highligted_node = notation_node;
            chess_game.resume_game_from_notation_node(notation_node);
            return;
        }
        this.current_row_element = move_notation.parentElement;
        this.make_notation_active(notation_node, move_notation);
        chess_game.resume_game_from_notation_node(notation_node);
    }

    get_notation_data(move_number, is_white) {
        const search_string = `[is_white="${is_white}"][move_number="${move_number}"]`;
        const move_notation = document.querySelector(search_string);
        return move_notation;
    }

    make_notation_active(notation_node, move_notation) {
        this.current_highligted_node = notation_node;
        this.all_move_notation_elements.forEach(elem => {
            elem.classList.remove("active");
        })
        move_notation.classList.add("active");
    }

    go_to_next_move(chess_game) {
        if (!this.current_highligted_node)
            return;
        // Implement for tree with choieces in which branch to go [FUTURE]
        if (this.current_highligted_node.children.length > 0) {
            const next = this.current_highligted_node.children[0];
            this.on_notation_click(null, next.notation_element, next, chess_game);
        }
    }

    go_to_previous_move(chess_game) {
        if (!this.current_highligted_node)
            return;
        if (!this.current_highligted_node.parent)
            return;
        const previous = this.current_highligted_node.parent;
        this.on_notation_click(null, previous.notation_element, previous, chess_game);
    }

    go_to_last_main_line_move(chess_game) {
        if (!this.current_highligted_node) {
            return;
        }
        let dummy = this.current_highligted_node;
        while (dummy.parent !== null) {
            dummy = dummy.parent;
        }

        while (dummy.children.length > 0 && dummy.children[0] !== null) {
            dummy = dummy.children[0];
        }
        this.on_notation_click(null, dummy.notation_element, dummy, chess_game);
    }

    go_to_first_move(chess_game) {
        if (!this.current_highligted_node) {
            return;
        }
        let dummy = this.current_highligted_node;
        while (dummy.parent !== null) {
            dummy = dummy.parent;
        }
        this.on_notation_click(null, dummy.notation_element, dummy, chess_game);

    }
}

function get_piece_shortname_dict() {
    const piece_shortname_dict = {}
    piece_shortname_dict[Pawn.name] = "";
    piece_shortname_dict[Knight.name] = "N";
    piece_shortname_dict[Bishop.name] = "B";
    piece_shortname_dict[Rook.name] = "R";
    piece_shortname_dict[Queen.name] = "Q";
    piece_shortname_dict[King.name] = "K";
    return piece_shortname_dict;
}

function create_new_main_row(notation_node) {
    const new_row = document.createElement("div");
    new_row.classList.add("notation-row");
    const move_number_element = document.createElement("div");
    move_number_element.classList.add("move-number");
    move_number_element.innerHTML = notation_node.move_number;
    new_row.append(move_number_element);

    return new_row;
}

function create_new_main_move_notation(notation_node) {
    const move_notation = document.createElement("div");
    move_notation.classList.add("move-notation");
    move_notation.setAttribute("is_white", notation_node.is_white);
    move_notation.setAttribute("move_number", notation_node.move_number);
    move_notation.innerHTML += notation_node.notation_data;

    return move_notation;
}