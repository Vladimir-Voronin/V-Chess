let from_coord;
let to_coord;
let is_animation = false;
let square_from = null;
let square_over = null;

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
    if (e.target.classList.contains("piece-size"))
        e.target.style.cursor = 'default';
}

function getSquareCoordinates(square) {
    return square.getAttribute("square-id");
}