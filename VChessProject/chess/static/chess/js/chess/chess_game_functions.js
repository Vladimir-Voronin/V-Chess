function showAvailableMovesHints(piece_square, chess_game) {
    if (!(piece_square in chess_game.available_moves_dict)) {
        return;
    }
    const available_moves_coord = chess_game.available_moves_dict[piece_square];
    for (var [square_coord, div_elem] of Object.entries(chess_game.chess_board.coord_square_dict)) {
        if (available_moves_coord.has(square_coord)) {
            let new_div;
            if (square_coord in chess_game.current_position) {
                // new_div = document.createElement("div");
                // new_div.classList.add("move-hint-eat-piece");
                // div_elem.appendChild(new_div);
                div_elem.classList.add("move-hint-eat-piece2")
            }
            else {
                new_div = document.createElement("div");
                new_div.classList.add("move-hint-empty");
                div_elem.appendChild(new_div);
            }
        }
    }
}

function removeAvailableMovesHints(chess_game) {
    for (var [square_coord, div_elem] of Object.entries(chess_game.chess_board.coord_square_dict)) {
        let to_remove = div_elem.querySelector(".move-hint-empty");
        if (to_remove) {
            div_elem.removeChild(to_remove);
        }
        to_remove = div_elem.querySelector(".move-hint-eat-piece");
        if (to_remove) {
            div_elem.removeChild(to_remove);
        }

        div_elem.classList.remove("move-hint-eat-piece2");
    }
}

function addSquareShadow(square) {
    if (square.classList.contains("dark-square")) {
        square.classList.add("dark-square-shadow");
    }
    if (square.classList.contains("light-square")) {
        square.classList.add("light-square-shadow");
    }
}

function removeSquareShadow(square) {
    if (!square)
        return;
    if (square.classList.contains("dark-square-shadow")) {
        square.classList.remove("dark-square-shadow");
    }
    if (square.classList.contains("light-square-shadow")) {
        square.classList.remove("light-square-shadow");
    }
}

function check_availability_to_move(piece_square, chess_game) {
    if (piece_square in chess_game.available_moves_dict)
        return true;
    return false;
}

function squareMouseOver(e) {
    if (e.target.tagName === "IMG") {
        if (!is_animation) {
            // Check if we can lead with this piece
            if ((check_availability_to_move(e.target.parentNode.parentNode.getAttribute("square-id"))))
                e.target.style.cursor = 'grab';
        }
    }
}

function squareMouseOut(e) {
    // if (e.target.classList.contains("piece-size"))
    //     e.target.style.cursor = 'default';
}

function getSquareCoordinates(square) {
    return square.getAttribute("square-id");
}

function is_draw_not_enough_resources(position) {
    const team_white_dict = {}
    const team_black_dict = {}
    for (var [square, piece] of Object.entries(position)) {
        if (piece.is_white) {
            let piece_name = piece.constructor.name;
            if (piece_name === "Bishop") {
                const square_color_is_white = is_square_white(square);
                if (square_color_is_white) {
                    piece_name += "_white";
                }
                else {
                    piece_name += "_black";
                }
            }
            if (!(piece_name in team_white_dict)) {
                team_white_dict[piece_name] = 1
            }
            else {
                team_white_dict[piece_name] += 1
            }
        }
        else {
            let piece_name = piece.constructor.name;
            if (piece_name === "Bishop") {
                const square_color_is_white = is_square_white(square);
                if (square_color_is_white) {
                    piece_name += "_white";
                }
                else {
                    piece_name += "_black";
                }
            }
            if (!(piece_name in team_black_dict)) {
                team_black_dict[piece_name] = 1
            }
            else {
                team_black_dict[piece_name] += 1
            }
        }
    }
    if (Object.keys(team_white_dict).length > 2) {
        return false;
    }
    if (Object.keys(team_black_dict).length > 2) {
        return false;
    }
    if ("Pawn" in team_white_dict || "Pawn" in team_black_dict) {
        return false;
    }
    if ((team_white_dict["Knight"] > 1) ||
        (team_black_dict["Knight"] > 1)) {
        return false;
    }
    if ((team_white_dict["Knight"] === 1) &&
        (team_black_dict["Knight"] === 1)) {
        return false;
    }
    if ("Bishop_white" in team_white_dict && "Bishop_black" in team_black_dict) {
        return false;
    }
    if ("Bishop_black" in team_white_dict && "Bishop_white" in team_black_dict) {
        return false;
    }
    return true;
}

function is_square_white(square) {
    const x = square.charCodeAt(0) - "a".charCodeAt(0) + 1;
    const y = Number(square[1]);
    return (x + y) % 2 === 0 ? false : true;
}

function create_string_from_position(position) {
    const suffix_white = "_w";
    const suffix_black = "_b";
    const all_squares = Object.keys(position);
    all_squares.sort();

    let result = "";
    all_squares.forEach(square => {
        let piece_name = position[square].constructor.name;
        piece_name += position[square].is_white ? suffix_white : suffix_black;
        result += square + piece_name;
    });
    return result;
}

function is_chess_square(s) {
    if (s.length === 2) {
        if ("abcdefgh".includes(s[0]) && "12345678".includes(s[1]))
            return true;
    }
    return false;
}