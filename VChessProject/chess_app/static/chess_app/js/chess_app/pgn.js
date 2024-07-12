function notation_lead_decode(s, position, white_move) {
    let initial_square = null;
    let move_square = null;
    let last_index = s.length - 1;
    while (last_index >= 1) {
        const potential_move_square = s[last_index - 1] + s[last_index]
        if (is_chess_square(potential_move_square)) {
            move_square = potential_move_square;
            break;
        }
        last_index -= 1;
    }
    last_index -= 2;

    let piece_type = null;
    let x_pointer = null;
    let y_pointer = null;

    while (last_index >= 0) {
        if ("NBQRK".includes(s[last_index])) {
            piece_type = s[last_index];
        }
        if ("abcdefgh".includes(s[last_index])) {
            x_pointer = s[last_index];
        }
        if ("12345678".includes(s[last_index])) {
            y_pointer = s[last_index];
            console.log(last_index);
        }
        last_index -= 1;
    }

    initial_square = get_possible_initial_squares_from_decoding_info(
        piece_type, x_pointer, y_pointer, position, white_move
    );

    return [initial_square, move_square]
}

function get_possible_initial_squares_from_decoding_info(piece_type,
    x_pointer,
    y_pointer,
    current_position,
    white_move
) {
    position = { ...current_position };
    console.log(position)
    console.log(piece_type)
    console.log(x_pointer)
    console.log(y_pointer)
    // delete all enemy pieces
    for (var [square_coord, piece] of Object.entries(position)) {
        if (piece.is_white !== white_move) {
            delete position[square_coord];
        }
    }

    const piece_type_decode = {
        null: Pawn.name,
        "N": Knight.name,
        "B": Bishop.name,
        "R": Rook.name,
        "Q": Queen.name,
        "K": King.name,
    }
    for (var [square_coord, piece] of Object.entries(position)) {
        if (piece.constructor.name !== piece_type_decode[piece_type]) {
            console.log(piece.constructor.name);
            delete position[square_coord];
        }
    }

    if (x_pointer !== null) {
        for (var [square_coord, piece] of Object.entries(position)) {
            if (square_coord[0] !== x_pointer) {
                delete position[square_coord];
            }
        }
    }
    if (y_pointer !== null) {
        for (var [square_coord, piece] of Object.entries(position)) {
            if (square_coord[1] !== y_pointer) {
                delete position[square_coord];
            }
        }
    }
    console.log(position);
    return Object.keys(position);
}