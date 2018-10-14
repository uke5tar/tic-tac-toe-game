// vanilla javascript document ready equivalent
var ready = function ( fn ) {
    if ( typeof fn !== 'function' ) return;
    if ( document.readyState === 'interactive' || document.readyState === 'complete' ) {
        return fn();
    }
    document.addEventListener( 'DOMContentLoaded', fn, false );
};

ready(function() {
    // all variables that need to be global accessible
    let $QSA = (elem) => document.querySelectorAll(elem),
        $QS = (elem) => document.querySelector(elem),
        $ID = (elem) => document.getElementById(elem),
        $Arr = (elem) => Array.from(elem),
        playerOne,
        playerTwoOrComp,
        currentPlayer,
        playerAmount,
        playerOneSymbol,
        playerTwoOrCompSymbol,
        gameIsRunning,
        winnerMoves = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
            [1, 4, 7],
            [2, 5, 8],
            [3, 6, 9],
            [1, 5, 9],
            [3, 5, 7]
        ],
        playerOneMoves = [],
        playerTwoOrCompMoves = [];

    // init function
    (function init() {
        getPlayerCount();
        $QS("#input-name button").addEventListener("click", () => getPlayerNames());
        $QSA("#draw button, #winner button").forEach(elem => elem.addEventListener("click", () => retry()));
    })();

    // ----- INTRO SCREENS ----
    // FIRST screen asks for player count
    function getPlayerCount() {
        $QSA("#welcome button").forEach(a => a.addEventListener("click", function() {
            if(this.value === "1") {
                $ID("twoplayer").remove();
                playerAmount = 1;
            } else {
                playerAmount = 2;
            }
            $ID("input-name").classList.add("slide-in");
            $ID("welcome").classList.add("slide-out");
            $ID("nameone").focus();
        }));
    }

    // SECOND screen asks for player names
    function getPlayerNames() {
        let onePlayer = $ID("twoplayer") === null ? true : false,
            inputLength = $Arr($QSA("form input")).filter(a => a.value === "").length,
            nextSlide = () => {
                $ID("input-name").classList.remove("slide-in");
                $ID("input-name").classList.add("slide-out");
                $ID("choose-symbol").classList.add("slide-in");
                chooseSymbol();
            };

        if(inputLength === 0) {
            $QS(".playerone.name").innerText = $ID("nameone").value;
            $QS("#choose-symbol .title").innerText = $ID("nameone").value + ": Choose X or O";
            if(onePlayer) {
                $QS(".playertwo.name").innerText = "Computer";
            } else {
                $QS(".playertwo.name").innerText = $ID("nametwo").value;
            }
            playerOne = $QS(".playerone.name").innerText;
            playerTwoOrComp = $QS(".playertwo.name").innerText;
            nextSlide();
        }
    }

    // THIRD screen asks player1 to choose symbol
    function chooseSymbol() {
        let nextSlide = () => {
                $ID("choose-symbol").classList.remove("slide-in");
                $ID("choose-symbol").classList.add("slide-out");
                $ID("game-table").classList.add("slide-in");
                $QS(".scoreboard-wrapper").style.display = "block";
                countDown();
            };
        $QSA("#choose-symbol button").forEach(a => a.addEventListener("click", function(e) {
            playerOneSymbol = this.value;
            $QS(".playerone.name").innerText = playerOne + " (" + playerOneSymbol + ")";
            playerOneSymbol === "x" ? playerTwoOrCompSymbol = "o" : playerTwoOrCompSymbol = "x";
            $QS(".playertwo.name").innerText = playerTwoOrComp + " (" + playerTwoOrCompSymbol + ")";
            nextSlide();
        }));
    }

    // FOURTH after choosing symbol the countdown for the game starts
    function countDown() {
        $QS("html").classList.add("countdown-bg");
        let counter = 3,
            timer = setInterval(() => {
            if(counter > 0) {
                switch(counter) {
                    case 3:
                        $ID("sound-three").play();
                        break;
                    case 2:
                        $ID("sound-two").play();
                        break;
                    case 1:
                        $ID("sound-one").play();
                        break;
                }
                $ID("countdown").innerText = counter--;
            }
            else {
                clearInterval(timer);
                $ID("countdown").innerText = $QS(".playerone.name").innerText + " VS " + $QS(".playertwo.name").innerText;
                let counterPartOne = (() => {
                    return setTimeout(() => {
                        $ID("countdown").innerText = "FIGHT";
                        $ID("sound-fight").play();
                        counterPartTwo();
                    }, 1000);
                })(),
                    counterPartTwo = () => {
                        return setTimeout(() => {
                            $ID("countdown").innerText = "";
                            $QS("html").classList.remove("countdown-bg");
                            startGame();
                    }, 1000);
                }
            }
        }, 1000);
    }

    // ---- GAME ----
    // get random integer within range min max INCLUDING max
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    // get the available moves for the player to win (amount === 3) or close to win/ block (amount === 2)
    function getPlayerWinnerMoves(playerMoves, amount) {
        return winnerMoves.map(arr => arr.filter(item => playerMoves.includes(item))).
        filter(item => item.length === amount);
    }

    // get current free cells
    function freeCells() {
        return $Arr($QSA(".game-cell")).filter(arr => arr.querySelector("span").innerText === "").map(item => parseInt(item.getAttribute("data-cell")));
    }

    // flattens any given multidimensional array
    function flattenNestedArray(arr) {
        return arr.reduce(function (a, b) {
            // if b is array call the func again otherwise join it with a
            return a.concat(Array.isArray(b) ? flattenNestedArray(b) : b);
        }, []);
    }

    // function to set a specific sell (the given argument) with symbol
    function setCell(num) {
        let target = $Arr($QSA(".game-cell")).filter(arr => arr.getAttribute("data-cell") === num.toString())[0];
        target.querySelector("span").innerText = playerTwoOrCompSymbol;
        target.classList.add("setting-cell");
        setTimeout(() => {
            target.classList.remove("setting-cell");
        }, 750)
    }

    // start game and let the dice decide who starts
    function startGame() {
        let dice = getRandomInt(0, 1);
        dice === 0 ? currentPlayer = playerOne : currentPlayer = playerTwoOrComp;
        gameIsRunning = true;
        playerAmount === 1 ? onePlayerGame() : twoPlayerGame();
    }

    // human vs computer game
    function onePlayerGame() {
        if(currentPlayer === playerOne) {
            if(gameIsRunning) {
                humanMove();
                setTimeout(() => {
                    $QS(".playertwo.name").classList.remove("active-player");
                    $QS(".playerone.name").classList.add("active-player");
                }, 500);
            }
        } else {
            if(gameIsRunning) {
                setTimeout(() => computerMove(), 500);
                $QS(".playerone.name").classList.remove("active-player");
                $QS(".playertwo.name").classList.add("active-player");
            }
        }
    }

    // move of the human in a oneplayer game
    function humanMove() {
        $QSA(".game-cell").forEach(a => a.addEventListener("click", function() {
            // set symbol for cell if it is empty
            if(this.querySelector("span").innerText === "") {
                this.querySelector("span").innerText = playerOneSymbol;
                // pushes the value of the clicked cell into either of the players array which keeps track of their moves
                playerOneMoves.push(parseInt(this.getAttribute("data-cell")));
                currentPlayer = playerTwoOrComp;
                checkForWinner(playerOneMoves);
            }
        }));
    }

    // decision of the computer to make a move that blocks the enemy or grants a win
    function blockOrWin(playerMoves) {
        return flattenNestedArray(getPlayerWinnerMoves(playerMoves, 2).map(item => winnerMoves.filter(arr => arr.includes(item[0]) && arr.includes(item[1])))).filter(item => !playerMoves.includes(item));
    }

    // decision process of the computer
    function computerMove() {
        // find all winnerMoves for the computer that are still available
        var compPossibleWinnerMoves = winnerMoves.map(arr => arr.filter(item => !playerOneMoves.includes(item))).
            filter(item => item.length === 3),
            block = blockOrWin(playerOneMoves).filter(item => !playerTwoOrCompMoves.includes(item))[0],
            win = blockOrWin(playerTwoOrCompMoves)[0],
            result;

        // if computer can win with next move => take win
        if(win !== undefined && !playerOneMoves.includes(win) && !playerTwoOrCompMoves.includes(win)) {
            result = win;
            setCell(result);
        }

        // if enemy can win with next move => block enemy
        else if(block !== undefined && !playerOneMoves.includes(block) && !playerTwoOrCompMoves.includes(block)) {
            result = block;
            setCell(result);
        }

        // if computer has just one cell filled proceed with filling a potential winner combination
        else {
            let setRandomCell = (function setRandomCell() {
                if(freeCells().length > 0) {
                    let min = 0,
                        max;
                    // if winner moves are still available
                    if(compPossibleWinnerMoves.length > 0) {
                        max = compPossibleWinnerMoves.length - 1;
                        result = compPossibleWinnerMoves[getRandomInt(min, max)][getRandomInt(min, 2)];
                        playerTwoOrCompMoves.includes(result) ? setRandomCell() : setCell(result);
                    // otherwise just fill out a random free cell
                    } else {
                        max = freeCells().length - 1;
                        result = freeCells()[getRandomInt(min, max)];
                        setCell(result);
                    }
                }
            })();
        }

        playerTwoOrCompMoves.push(result); // push the current move to a move-tracking-array
        currentPlayer = playerOne; // swich players
        checkForWinner(playerTwoOrCompMoves); // check if comp wins
    }

    // check for winner or draw
    function checkForWinner(playerMoves) {
        // evaluates true for the first player who has the same playerMoves as one of the potential winnerMoves
        if(getPlayerWinnerMoves(playerMoves, 3).length > 0) {
            // stop game
            gameIsRunning = false;

            if(playerAmount === 1) {
                // switch players back to declare correct winner in oneplayergame
                currentPlayer === playerOne ? currentPlayer = playerTwoOrComp : currentPlayer = playerOne;
            }

            // define winner and loser and display a random winner text
            let winner = (currentPlayer === playerOne ? playerOne : playerTwoOrComp),
                loser = (currentPlayer === playerOne ? playerTwoOrComp : playerOne),
                getRandomWinnerText = (winnerName, loserName) => {
                    return [
                        winnerName + " just slaughtered " + loserName + "!",
                        loserName + " just got owned by " + winnerName + ".",
                        loserName + " is no match for " + winnerName + ".",
                        winnerName + " showed " + loserName + " who is the boss.",
                        winnerName + " pulled " + loserName + " through the dirt.",
                        "There is a new Sheriff in town - " + winnerName + " smashed " + loserName
                ]},
                winnerText = getRandomWinnerText(winner, loser),

                // find the correct winning Array
                winnerArr = ((playerMoves) => winnerMoves.map(arr => arr.filter(item => playerMoves.includes(item))).
                    filter(item => item.length === 3)[0])(playerMoves),
                // identify the winning cells
                winnerArrCell = winnerArr.map(item => $Arr($QSA(".game-cell")).filter(cell => cell.getAttribute("data-cell") === item.toString()));

            // ---- END GAME STYLING ----
            $QS("html").classList.add("countdown-bg");
            $QS(".playerone.name").classList.remove("active-player");
            $QS(".playertwo.name").classList.remove("active-player");
            // highlight the winning cells
            winnerArrCell.forEach(elem => elem[0].classList.add("winner-cell"));
            setTimeout(() => {
                $ID("game-table").classList.remove("slide-in");
                $ID("game-table").classList.add("slide-out");
                $ID("winner").classList.add("slide-in");
                $QS("#winner .declare-winner").innerText = winner + " wins";
                $QS("#winner .random-text").innerText = winnerText[getRandomInt(0, winnerText.length - 1)];
            }, 2000);

            // set score
            if(winner === playerOne) {
                let playerOneScore = parseInt($QS(".playerone.score").innerText);
                $QS(".playerone.score").innerText = ++playerOneScore;
            } else {
                let playerTwoScore = parseInt($QS(".playertwo.score").innerText);
                $QS(".playertwo.score").innerText = ++playerTwoScore;
            }

            return false;
        }
        // evaluates true if all cells have value but no winner has been declared --> draw
        else if($Arr($QSA(".game-cell span")).filter(a => a.innerText !== "").length === 9) {
            // random draw texts
            let getRandomDrawText = (playerone, playertwo) => {
                    return [
                        playerone + " you suck in this as much as " + playertwo + "!",
                        playerone + " and " + playertwo + ": You both don't deserve to play this game!",
                        "Congratulations - You play equally bad.",
                        "Zero - Or the result of " + playerone + "'s and " + playertwo + "'s skills.",
                        playerone + " & " + playertwo + ": You both suck big time."
                ]},
                drawText = getRandomDrawText(playerOne, playerTwoOrComp);
            // game styling
            $QS(".playerone.name").classList.remove("active-player");
            $QS(".playertwo.name").classList.remove("active-player");
            $QS("html").classList.add("countdown-bg");
            $QSA(".game-cell").forEach(function(elem) {
                elem.classList.add("transparent-bg");
            });
            setTimeout(() => {
                $QSA(".game-cell").forEach(function(elem) {
                    elem.classList.remove("transparent-bg");
                });
                $ID("game-table").classList.remove("slide-in");
                $ID("game-table").classList.add("slide-out");
                $ID("draw").classList.add("slide-in");
                $QS("#draw .random-text").innerText = drawText[getRandomInt(0, drawText.length - 1)];
            }, 2000);

            return false;
        }
        // slightly different mechanic of end game style necessary depending of one or two player game is played
        if(playerAmount === 1) {
            onePlayerGame()
        } else {
            setTimeout(() => {
                if(currentPlayer === playerOne) {
                    $QS(".playertwo.name").classList.remove("active-player");
                    $QS(".playerone.name").classList.add("active-player");
                } else {
                    $QS(".playerone.name").classList.remove("active-player");
                    $QS(".playertwo.name").classList.add("active-player");
                }
            }, 500);
            twoPlayerGame();
        }
    }

    // human vs human game
    function twoPlayerGame() {
        if(currentPlayer === playerOne) {
            $QS(".playertwo.name").classList.remove("active-player");
            $QS(".playerone.name").classList.add("active-player");
        } else {
            $QS(".playerone.name").classList.remove("active-player");
            $QS(".playertwo.name").classList.add("active-player");
        }

        $QSA(".game-cell").forEach(a => a.addEventListener("click", function() {
            if(this.querySelector("span").innerText === "") {
                if(currentPlayer === playerOne) {
                    this.querySelector("span").innerText = playerOneSymbol;
                    playerOneMoves.push(parseInt(this.getAttribute("data-cell")));
                    checkForWinner(playerOneMoves);
                } else {
                    this.querySelector("span").innerText = playerTwoOrCompSymbol;
                    playerTwoOrCompMoves.push(parseInt(this.getAttribute("data-cell")));
                    checkForWinner(playerTwoOrCompMoves);
                }
                // change current player
                currentPlayer === playerOne ? currentPlayer = playerTwoOrComp : currentPlayer = playerOne;
            }
        }));
    }

    // reset the game to be played again (scoreboard doesnt get reset)
    function retry() {
        gameIsRunning = true,
        playerOneMoves = [],
        playerTwoOrCompMoves = [];

        $QSA("#draw, #winner").forEach(elem => {
            elem.classList.remove("slide-in");
            elem.classList.add("slide-out");
        });

        $QS("html").classList.remove("countdown-bg");
        $ID("game-table").classList.remove("slide-out");
        $ID("game-table").classList.add("slide-in");

        $QSA(".game-cell").forEach(function(elem) {
            elem.querySelector("span").innerText = "";
            elem.classList.remove("winner-cell");
        });

        setTimeout(() => {
            startGame();
        }, 1500);
    }

// end document ready
});
