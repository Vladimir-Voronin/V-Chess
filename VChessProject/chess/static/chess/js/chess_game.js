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

        // all_squares.forEach(square => {
        //     square.addEventListener("dragstart", dragStart);
        //     square.addEventListener("dragover", dragOver);
        //     square.addEventListener("drop", dragDrop);
        // })
        all_squares.forEach(square => {
            square.addEventListener('mousedown', squareMouseDown);
            square.addEventListener('mouseover', squareMouseOver);
            square.addEventListener('mouseout', squareMouseOut);
        })

    }

    // means there is a piece on a square
    make_square_draggable(square_coord) {
        const square = $(`[square-id="${square_coord}"]`)[0];
        if (square) {

            square.setAttribute('draggable', true);
        }
    }

    add_piece_element(figure_element, coord) {
        const square_element = this.coord_square_dict[coord];
        square_element.innerHTML = figure_element;
    }

    remove_piece_element(figure_element, coord) {

    }
}

class ChessGame {
    constructor(chess_board) {
        this.chess_board = chess_board;
        this.all_pieces = null;
    }
    set_figure_start_position() {
        this.all_pieces = [
            new Rook(rook_w_element, true, "a1"),
            new Knight(knight_w_element, true, "b1"),
            new Bishop(bishop_w_element, true, "c1"),
            new Queen(queen_w_element, true, "d1"),
            new King(king_w_element, true, "e1"),
            new Bishop(bishop_w_element, true, "f1"),
            new Knight(knight_w_element, true, "g1"),
            new Rook(rook_w_element, true, "h1"),
            new Pawn(pawn_w_element, true, "a2"),
            new Pawn(pawn_w_element, true, "b2"),
            new Pawn(pawn_w_element, true, "c2"),
            new Pawn(pawn_w_element, true, "d2"),
            new Pawn(pawn_w_element, true, "e2"),
            new Pawn(pawn_w_element, true, "f2"),
            new Pawn(pawn_w_element, true, "g2"),
            new Pawn(pawn_w_element, true, "h2"),
            new Rook(rook_b_element, false, "a8"),
            new Knight(knight_b_element, false, "b8"),
            new Bishop(bishop_b_element, false, "c8"),
            new Queen(queen_b_element, false, "d8"),
            new King(king_b_element, false, "e8"),
            new Bishop(bishop_b_element, false, "f8"),
            new Knight(knight_b_element, false, "g8"),
            new Rook(rook_b_element, false, "h8"),
            new Pawn(pawn_b_element, false, "a7"),
            new Pawn(pawn_b_element, false, "b7"),
            new Pawn(pawn_b_element, false, "c7"),
            new Pawn(pawn_b_element, false, "d7"),
            new Pawn(pawn_b_element, false, "e7"),
            new Pawn(pawn_b_element, false, "f7"),
            new Pawn(pawn_b_element, false, "g7"),
            new Pawn(pawn_b_element, false, "h7"),
        ];

        this.all_pieces.forEach(value => {
            this.chess_board.add_piece_element(value.element, value.square_coord);
            this.chess_board.make_square_draggable(value.square_coord);
        });
    }
}

class ChessPiece {
    constructor(element, is_white, square_coord) {
        this.element = element;
        this.is_white = is_white;
        this.square_coord = square_coord;
    }
}

class Pawn extends ChessPiece {

}

class Knight extends ChessPiece {

}

class Bishop extends ChessPiece {

}

class Rook extends ChessPiece {

}

class Queen extends ChessPiece {

}

class King extends ChessPiece {

}

let from_coord;
let to_coord;
let is_animation = false;
let square_from = null;
let square_over = null;

function squareMouseDown(e) {
    // check if square has a piece
    if (e.target.tagName !== "IMG")
        return false;
    console.log("You have chosen a piece");
    current_choosen_piece = e.target;

    // check if you may lead with this piece (FUTURE)

    // take the start coordinate of square
    square_from = current_choosen_piece.parentNode.parentNode;
    addSquareShadow(square_from);
    from_coord = square_from.getAttribute("square-id");
    console.log("From coord: ", from_coord);

    // create a dummy of a piece for animation purpose
    piece_dummy = current_choosen_piece.cloneNode();
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
        console.log(to_coord)
        removeSquareShadow(square_from);
        removeSquareShadow(square_over);
        square_from = null;
        square_over = null;

        // if lead - change location of a piece (FUTURE)
        current_choosen_piece.style.visibility = 'visible';

        is_animation = false;
    }

    piece_dummy.ondragstart = function () {
        return false;
    };
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
            if (elem != square_over && elem != square_from) {
                removeSquareShadow(square_over);
                square_over = elem;
                addSquareShadow(square_over);
            }
        }
    });
    if (!on_board_flag) {
        removeSquareShadow(square_over);
        square_over = null;
    }
}

function squareMouseOver(e) {
    if (e.target.tagName === "IMG") {
        if (!is_animation) {
            // Check if we can lead with this piece (FUTURE)
            e.target.style.cursor = 'grab';
        }
    }

}

function squareMouseOut(e) {
    if (e.target.classList.contains("piece-size"))
        e.target.style.cursor = 'pointer';

}

function getSquareCoordinates(square) {
    return square.getAttribute("square-id");
}