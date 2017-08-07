var con;
var connectionId;
var p1username; // save p1 name from input
var p2username; // save p2 name from input
var username; // use to pass player (1 or 2) name into firebase
var player1; // playerObj instance
var player2; // playerObj instance
var chatText;
var disconnected;
var tie;

var config = {
    apiKey: "AIzaSyAt7Zo2dzpJKR8aTFUSKY-U4tgvDIezWjc",
    authDomain: "rock-paper-scissors-885a6.firebaseapp.com",
    databaseURL: "https://rock-paper-scissors-885a6.firebaseio.com",
    projectId: "rock-paper-scissors-885a6",
    storageBucket: "",
    messagingSenderId: "589730890034"
};
firebase.initializeApp(config);

var database = firebase.database();
var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");

// player class
function playerObj(username, connectionId, choice, wins, losses, ties) {
    this.username = username,
        this.connectionId = connectionId,
        this.choice = choice, // r, p or s
        this.wins = wins,
        this.losses = losses,
        this.ties = ties
}

// html behavior for player slot when player exists in that slot, executes on fb value change
function playerExists(playerNumber, playerPath, snapshot) {
    $(`#player${playerNumber}Name`).attr('data-status', 'taken');
    $(`#p${playerNumber}Heading`).html("<strong>" + playerPath.username + "</strong>");
    $(`#player${playerNumber}Name`).text("");
    $(`#player${playerNumber}Wins`).text(playerPath.wins);
    $(`#player${playerNumber}Losses`).text(playerPath.losses);
    $(`#player${playerNumber}Ties`).text(playerPath.ties);
    $(`.player${playerNumber}Stats`).show();

    if (playerPath.connectionId === connectionId) {
        $('p.playerSelectUI').html("Welcome<strong> " + playerPath.username + "</strong>. You are Player " + playerNumber);
        $('input.playerSelectUI').hide();
        $('#chatField').show();
        $('#chatBtn').show();
    }
}

// html behavior for player slot when slot is empty, executes on fb value change
function playerNotExists(playerNumber, oppNumber, oppPath, snapshot) {
    $('.gameDisplay').html("<h1 id='gameHeader'>RPS Online Championship!</h1>");
    $(`#player${playerNumber}Name`).attr('data-status', 'open')
        .text("Waiting for Player...");
    $(`#p${playerNumber}Heading`).text(`Player ${playerNumber}`);
    $(`.player${playerNumber}Stats`).hide();
    $(`.player${playerNumber}Btns`).hide();
    $(`.player${oppNumber}Btns`).hide();

    if (snapshot.child(`player${oppNumber}`).exists()) {
        if (connectionId !== oppPath.connectionId) {
            $('p.playerSelectUI').text('Enter a username:');
            $('.playerSelectUI').show();
            $('#chatField').hide();
            $('#chatBtn').hide();

        }
    }
}

function tieGame(snapshot) {
    database.ref('player1').update({
        choice: "",
        ties: snapshot.val().player1.ties + 1
    });
    database.ref('player2').update({
        choice: "",
        ties: snapshot.val().player2.ties + 1
    });
    reset();
}

function updateWins(player, path) {
    database.ref(player).update({
        wins: path + 1,
        choice: ""
    });
}

function updateLosses(player, path) {
    database.ref(player).update({
        losses: path + 1,
        choice: ""
    });
}

function reset() {
    setTimeout(function() {
        $('.gameDisplay').html("<h1 id='gameHeader'>Let's Play RPS!!!</h1>");
        database.ref().update({
            turn: 1
        });
    }, 3500);
}

function updateStats(winner, winnerPath, loser, loserPath, ) {
    $('.gameDisplay').html('<h1 id="gameHeader"><strong>' + winnerPath.username + '</strong> Wins!!!</h1>' + '<div><strong>' + winnerPath.username + ' </strong>chose ' +
        $(`.${winner}Val[data-value=${winnerPath.choice}]`).html() + '</div><br>' +
        '<div><strong>' + loserPath.username + ' </strong>chose ' +
        $(`.${loser}Val[data-value=${loserPath.choice}]`).html() + '</div>');
    updateWins(winner, winnerPath.wins);
    updateLosses(loser, loserPath.losses);
    reset();
}

$(document).ready(function() {
    $('.player1Btns, .player1Stats, .player2Btns, .player2Stats').hide(); // hide on load to prevent html flash from firebase lag
    // monitor partieds connected to fb db
    connectedRef.on("value", function(snap) {
        if (snap.val()) {
            con = connectionsRef.push(true);
            connectionId = con.path.ct[1];
            con.onDisconnect().remove();
        }
    });
    // initialize chat child in fb db
    database.ref('chat').update({
        chatText: ""
    });
    // add new player
    $('.enterPlayerBtn').on("click", function(e) {
        e.preventDefault();

        if ($('#player1Name').attr('data-status') === 'open') {
            player1 = new playerObj($('.usernameField').val(), con.path.ct[1], "", 0, 0, 0);
            username = player1.username;

            database.ref().update({
                player1: player1,
                turn: 1
            });
            // set up disconnect message, this will display to remaining players and observers
            disconnected = '<span class="luckyFont">' + username + ' <span class="missSkinnyFont">has disconnected</span>';
            database.ref("chat").onDisconnect().update({
                chatText: disconnected
            });

            database.ref("player1").onDisconnect().remove();

        } else if ($('#player1Name').attr('data-status') === 'taken') {
            player2 = new playerObj($('.usernameField').val(), con.path.ct[1], "", 0, 0, 0);
            username = player2.username;

            database.ref().update({
                player2: player2,
                turn: 1
            });
            // set up disconnect message, displays to remaining players and observers
            disconnected = '<span class="luckyFont">' + username + ' <span class="missSkinnyFont">has disconnected</span>';
            database.ref("chat").onDisconnect().update({
                chatText: disconnected
            });

            database.ref("player2").onDisconnect().remove();
        }
    });
    // pass player1 choice to fb
    $('.p1Val').on('click', function() {
        player1.choice = $(this).attr('data-value');
        database.ref("player1").update({
            choice: $(this).attr('data-value')
        });
        database.ref().update({
            turn: 2
        });
    });
    // pass player2 choice to fb
    $('.p2Val').on('click', function() {
        player2.choice = $(this).attr('data-value');
        database.ref("player2").update({
            choice: $(this).attr('data-value')
        });
        database.ref().update({
            turn: 3
        });
    });
    // send chat message to fb db
    $('#chatBtn').on('click', function(event) {
        event.preventDefault();
        chatText = '<span class="luckyFont">' + username + ':</span><span class="missSkinnyFont"> ' + $('#chatField').val() + '</span>';
        database.ref('chat').update({
            chatText: chatText
        });
    });

    // display chat messages and scroll down to latest?
    database.ref('chat').on('value', function(snapshot) {
        if (snapshot.val().chatText !== "") {
            $('#chatMessages').append('<div class="leftBump">' + snapshot.val().chatText + '</div>');
            $('#chatField').val("");
            $('.chatWindow').scrollTop($('.chatWindow').prop('scrollHeight')); // auto-scroll window
            database.ref('chat').update({
                chatText: "" // allows repeat messages
            });
        }
    });

    database.ref().on("value", function(snapshot) {
        // page html behavior based on player existance
        if (snapshot.child("player1").exists()) {
            playerExists(1, snapshot.val().player1, snapshot);
        }

        if (snapshot.child("player2").exists()) {
            playerExists(2, snapshot.val().player2, snapshot);
        }

        if (!snapshot.child("player1").exists()) {
            playerNotExists(1, 2, snapshot.val().player2, snapshot);
        }

        if (!snapshot.child("player2").exists()) {
            playerNotExists(2, 1, snapshot.val().player1, snapshot);
        }

        if (!snapshot.child("player1").exists() && !snapshot.child("player2").exists()) {
            $('#chatField').hide();
            $('#chatBtn').hide(); //hide chat input if no players exist
        }

        if (snapshot.child("player1").exists() && snapshot.child("player2").exists()) {
            // html behavior for observer when two players exist
            if (snapshot.val().player1.connectionId !== connectionId) {
                if (snapshot.val().player2.connectionId !== connectionId) {
                    $('p.playerSelectUI').text('Game in Progress. You must wait for a player to leave.');
                    $('input.playerSelectUI').hide();
                    $('#chatField').hide();
                    $('#chatBtn').hide();
                    $('.player1Btns').hide();
                    $('.player2Btns').hide();
                }
            }
            // button/html display behavior based on turn and connectionId
            if (snapshot.val().turn === 1) {
                if (snapshot.val().player1.connectionId === connectionId) {
                    $('.gameDisplay').html("<h1 id='gameHeader'>Let's Play RPS!!!</h1>");
                    $('.player1Btns').show();
                    $('#player1Name').text("It's your turn");

                } else if (snapshot.val().player2.connectionId === connectionId) {
                    $('.gameDisplay').html("<h1 id='gameHeader'>Let's Play RPS!!!</h1>");
                    $('#player2Name').append('<br>Waiting for Player 1<br> to choose');

                }
            } else if (snapshot.val().turn === 2) {
                if (snapshot.val().player1.connectionId === connectionId) {
                    $('.player1Btns').hide();
                }
                if (snapshot.val().player2.connectionId === connectionId) {
                    $('.player2Btns').show();
                    $('#player2Name').text("It's your turn");
                } else if (snapshot.val().player1.connectionId === connectionId) {
                    $('#player1Name').append('<br>Waiting for Player 2<br> to choose');
                }
            } else if (snapshot.val().turn === 3) {
                $('.player2Btns').hide();
            }
            // game logic - compare player choices and update page accordingly
            if (snapshot.val().player1.choice === snapshot.val().player2.choice &&
                snapshot.val().player1.choice !== "" && snapshot.val().player2.choice !== "") {
                tie = snapshot.val().player1.choice;
                $('.gameDisplay').html('<h1 id="gameHeader">Tie Game!</h1><div>You both chose:</div><div>' + $(`.player1Val[data-value=${tie}]`).html() + '</div>');
                tieGame(snapshot);

            } else if (snapshot.val().player1.choice === 'Rock' && snapshot.val().player2.choice === 'Scissors') {
                updateStats("player1", snapshot.val().player1, "player2", snapshot.val().player2);

            } else if (snapshot.val().player1.choice === 'Rock' && snapshot.val().player2.choice === 'Paper') {
                updateStats("player2", snapshot.val().player2, "player1", snapshot.val().player1);

            } else if (snapshot.val().player1.choice === 'Paper' && snapshot.val().player2.choice === 'Rock') {
                updateStats("player1", snapshot.val().player1, "player2", snapshot.val().player2);

            } else if (snapshot.val().player1.choice === 'Paper' && snapshot.val().player2.choice === 'Scissors') {
                updateStats("player2", snapshot.val().player2, "player1", snapshot.val().player1);

            } else if (snapshot.val().player1.choice === 'Scissors' && snapshot.val().player2.choice === 'Paper') {
                updateStats("player1", snapshot.val().player1, "player2", snapshot.val().player2);

            } else if (snapshot.val().player1.choice === 'Scissors' && snapshot.val().player2.choice === 'Rock') {
                updateStats("player2", snapshot.val().player2, "player1", snapshot.val().player1);

            }
        }
    }); // end database.ref().on('value') listener
}); // end $(document).ready()

//  
// validate files
