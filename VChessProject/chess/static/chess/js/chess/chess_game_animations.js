let from_coord;
let to_coord;
let is_animation = false;
let square_from = null;
let square_over = null;

function squareMouseDown(e) {
    // check if square has a piece
    if (e.target.tagName !== "IMG")
        return false;
    current_choosen_piece = e.target;

    // take the start coordinate of square
    square_from = current_choosen_piece.parentNode.parentNode;
    const current_square_id = square_from.getAttribute("square-id");

    // check if you may lead with this piece
    if (!(check_availability_to_move(current_square_id)))
        return;

    addSquareShadow(square_from);
    from_coord = current_square_id

    showAvailableMovesHints(current_square_id);

    // create a dummy of a piece for animation purpose
    const piece_dummy = current_choosen_piece.cloneNode();
    piece_dummy.classList.remove("piece-size");
    piece_dummy.classList.add("piece-dummy");
    piece_dummy.style.width = current_choosen_piece.clientWidth + "px";
    piece_dummy.style.height = current_choosen_piece.clientHeight + "px";

    // make real piece invisible when we drag its dummy
    current_choosen_piece.style.visibility = 'hidden';

    document.onmousemove = function (e) {
        moveAt(piece_dummy, e);
    }
    document.body.append(piece_dummy);
    moveAt(piece_dummy, e);

    piece_dummy.onmouseup = function () {
        document.onmousemove = null;
        piece_dummy.onmouseup = null;
        piece_dummy.remove();
        if (square_over)
            to_coord = getSquareCoordinates(square_over);

        if (to_coord) {
            chess_game.make_move(from_coord, to_coord);
        }
        removeSquareShadow(square_from);
        removeSquareShadow(square_over);
        square_from = null;
        square_over = null;

        removeAvailableMovesHints();

        // if lead - change location of a piece (FUTURE)
        current_choosen_piece.style.visibility = 'visible';

        is_animation = false;
    }

    piece_dummy.ondragstart = function () {
        return false;
    };
}

function showAvailableMovesHints(piece_square) {
    if (!(piece_square in chess_game.available_moves_dict)) {
        return;
    }
    const available_moves_coord = chess_game.available_moves_dict[piece_square];
    for (var [square_coord, div_elem] of Object.entries(chess_board.coord_square_dict)) {
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

function removeAvailableMovesHints() {
    for (var [square_coord, div_elem] of Object.entries(chess_board.coord_square_dict)) {
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

function moveAt(dummy, e) {
    dummy.style.left = e.pageX - dummy.offsetWidth / 2 + 'px';
    dummy.style.top = e.pageY - dummy.offsetHeight / 2 + 'px';

    var elements = document.elementsFromPoint(e.pageX, e.pageY)
    let on_board_flag = false;
    elements.forEach(elem => {
        if (elem.classList.contains("chess-square")) {
            on_board_flag = true;
            if (elem !== square_over) {
                if (square_over !== square_from)
                    removeSquareShadow(square_over);
                square_over = elem;
                addSquareShadow(square_over);
            }
        }
    });
    if (!on_board_flag) {
        removeSquareShadow(square_over);
        square_over = null;
        to_coord = null;
    }
}

function check_availability_to_move(piece_square) {
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