
class ChessPiece {
    constructor(element, is_white) {
        this.element = element;
        this.is_white = is_white;
    }

    get_available_moves(chess_square, current_position) { }
}

class Pawn extends ChessPiece {
    get_available_moves(piece_square, current_position) {
        const available_leads = new Set();
        // because pawn can move only one direction (up for white, down for black)
        const sign = this.is_white ? 1 : -1;
        const plus_y_1 = get_square_coord_shift(piece_square, 0, sign);
        if (plus_y_1 && !(plus_y_1 in current_position)) {
            available_leads.add(plus_y_1);

            if ((piece_square[1] === "2" && this.is_white) || (piece_square[1] === "7" && !this.is_white)) {
                const plus_y_2 = get_square_coord_shift(piece_square, 0, sign * 2);
                if (plus_y_2 && !(plus_y_2 in current_position)) {
                    available_leads.add(plus_y_2);
                }
            }
        }

        const diag_1_1 = get_square_coord_shift(piece_square, 1, sign);
        const diag_m1_1 = get_square_coord_shift(piece_square, -1, sign);
        for (const field of [diag_1_1, diag_m1_1]) {
            if (field in current_position && current_position[field].is_white !== this.is_white) {
                available_leads.add(field);
            }
        }
        return available_leads;
    }
}

class Knight extends ChessPiece {
    get_available_moves(chess_square, current_position) {
        const available_leads = new Set();
        const shift_combinations = [[2, 1],
        [1, 2],
        [-2, 1],
        [1, -2],
        [2, -1],
        [-1, 2],
        [-2, -1],
        [-1, -2],
        ]
        shift_combinations.forEach(shift => {
            const potential_square = get_square_coord_shift(chess_square, shift[0], shift[1]);
            if (!(potential_square in current_position) || current_position[potential_square].is_white !== this.is_white) {
                available_leads.add(potential_square);
            }
        })
        return available_leads;
    }
}

class Bishop extends ChessPiece {
    get_available_moves(chess_square, current_position) {
        const available_leads = new Set();
        const axes = [[1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1]]

        axes.forEach(axis => {
            let potential_square = null;
            let iteration = 1;
            while (true) {
                potential_square = get_square_coord_shift(chess_square, axis[0] * iteration, axis[1] * iteration);
                if (!potential_square) {
                    break
                }
                if (!(potential_square in current_position)) {
                    available_leads.add(potential_square);
                    iteration += 1;
                    continue;
                }
                if (current_position[potential_square].is_white !== this.is_white) {
                    available_leads.add(potential_square);
                    break;
                }
                break
            }
        })

        return available_leads;
    }
}

class Rook extends ChessPiece {
    get_available_moves(chess_square, current_position) {
        const available_leads = new Set();
        const axes = [[1, 0],
        [0, -1],
        [-1, 0],
        [0, 1]]

        axes.forEach(axis => {
            let potential_square = null;
            let iteration = 1;
            while (true) {
                potential_square = get_square_coord_shift(chess_square, axis[0] * iteration, axis[1] * iteration);
                if (!potential_square) {
                    break
                }
                if (!(potential_square in current_position)) {
                    available_leads.add(potential_square);
                    iteration += 1;
                    continue;
                }
                if (current_position[potential_square].is_white !== this.is_white) {
                    available_leads.add(potential_square);
                    break;
                }
                break
            }
        })

        return available_leads;
    }
}

class Queen extends ChessPiece {
    get_available_moves(chess_square, current_position) {
        const available_leads = new Set();
        let axes = [[1, 0],
        [0, -1],
        [-1, 0],
        [0, 1]]

        axes.forEach(axis => {
            let potential_square = null;
            let iteration = 1;
            while (true) {
                potential_square = get_square_coord_shift(chess_square, axis[0] * iteration, axis[1] * iteration);
                if (!potential_square) {
                    break
                }
                if (!(potential_square in current_position)) {
                    available_leads.add(potential_square);
                    iteration += 1;
                    continue;
                }
                if (current_position[potential_square].is_white !== this.is_white) {
                    available_leads.add(potential_square);
                    break;
                }
                break
            }
        })

        axes = [[1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1]]

        axes.forEach(axis => {
            let potential_square = null;
            let iteration = 1;
            while (true) {
                potential_square = get_square_coord_shift(chess_square, axis[0] * iteration, axis[1] * iteration);
                if (!potential_square) {
                    break
                }
                if (!(potential_square in current_position)) {
                    available_leads.add(potential_square);
                    iteration += 1;
                    continue;
                }
                if (current_position[potential_square].is_white !== this.is_white) {
                    available_leads.add(potential_square);
                    break;
                }
                break
            }
        })

        return available_leads;
    }
}

class King extends ChessPiece {
    get_available_moves(chess_square, current_position) {
        const available_leads = new Set();
        const axes = [[1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
        [1, 0],
        [0, -1],
        [-1, 0],
        [0, 1]
        ]

        axes.forEach(axis => {
            let potential_square = null;
            potential_square = get_square_coord_shift(chess_square, axis[0], axis[1]);
            if (!potential_square) {

            }
            else if (!(potential_square in current_position)) {
                available_leads.add(potential_square);
            }
            else if (current_position[potential_square].is_white !== this.is_white) {
                available_leads.add(potential_square);
            }
        })

        return available_leads;
    }

    get_castle_moves(chess_square, current_position, is_0_0_available, is_0_0_0_available) {
        const available_leads = new Set();

        if (is_0_0_available) {
            const check_square_clear_right1 = get_square_coord_shift(chess_square, 1, 0);
            const check_square_clear_right2 = get_square_coord_shift(chess_square, 2, 0);
            if ((!(check_square_clear_right1 in current_position)) &&
                (!(check_square_clear_right2 in current_position))) {
                available_leads.add(check_square_clear_right2);
            }
        }

        if (is_0_0_0_available) {
            const check_square_clear_left1 = get_square_coord_shift(chess_square, -1, 0);
            const check_square_clear_left2 = get_square_coord_shift(chess_square, -2, 0);
            if ((!(check_square_clear_left1 in current_position)) &&
                (!(check_square_clear_left2 in current_position))) {
                available_leads.add(check_square_clear_left2);
            }
        }

        return available_leads;
    }
}

function get_square_coord_shift(current_square, shift_x, shift_y) {
    let result = "";
    const current_x = current_square.charCodeAt(0) - 'a'.charCodeAt(0);
    const result_x_number = current_x + shift_x;
    const current_y = Number(current_square[1]);
    const result_y_number = current_y + shift_y;
    if (result_x_number < 0 || result_x_number > 7 ||
        result_y_number < 1 || result_y_number > 8
    ) {
        return null;
    }

    const result_x = String.fromCharCode('a'.charCodeAt(0) + result_x_number);
    const result_y = String(result_y_number)
    result = result_x + result_y;
    return result;
}