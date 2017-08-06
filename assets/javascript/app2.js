var con;
var p1username;     // save p1 name from input
var p2username;     // save p2 name from input
var username;       // use to pass player (1 or 2) name into firebase
var connectionId;
var player1;    // playerObj instance
var player2;    // playerObj instance
var chatText;
var disconnected;

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

function playerExists(playerNumber, playerPath, snapshot) {
    $(`#player${playerNumber}Name`).attr('data-status', 'taken');
    $(`#player${playerNumber}Name`).text(playerPath.username);
    $(`#player${playerNumber}Wins`).text(playerPath.wins);
    $(`#player${playerNumber}Losses`).text(playerPath.losses);
    $(`#player${playerNumber}Ties`).text(playerPath.ties);
    $(`.player${playerNumber}Stats`).show();

    if (playerPath.connectionId === connectionId) {
        $('p.playerSelectUI').text("Welcome " + playerPath.username + ". You are Player " + playerNumber);
        $('input.playerSelectUI').hide();
        $('div.chatInput').show();
    }
}

function playerNotExists(playerNumber, oppNumber, oppPath, snapshot) {
    $(`#player${playerNumber}Name`).attr('data-status', 'open')
        .text("Waiting for Player...");
    $(`.player${playerNumber}Stats`).hide();
    $(`.player${playerNumber}Btns`).hide();
    $(`.player${oppNumber}Btns`).hide();

    if (snapshot.child(`player${oppNumber}`).exists()) {
        if (connectionId !== oppPath.connectionId) {
            $('p.playerSelectUI').text('Enter a username:');
            $('.playerSelectUI').show();
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
    setTimeout(function() {
        $('.gameDisplay').text('output results here');
        database.ref().update({
            turn: 1
        });
    }, 3500);
}

function updateWins(player, path) {
    $('.gameDisplay').text(player + ' wins (add all outcomes later');
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
        $('.gameDisplay').text('output results here');
        database.ref().update({
            turn: 1
        });
    }, 3500);
}

$(document).ready(function() {
    // add back in way 100% sure that hiding is working without it
    // $('.player1Btns, .player1Stats, .player2Btns, .player2Stats').hide();
    // monitor connected parties on fb db
    connectedRef.on("value", function(snap) {
        if (snap.val()) {
            con = connectionsRef.push(true);
            connectionId = con.path.ct[1];
            con.onDisconnect().remove();
        }
    });

    database.ref('chat').update({
        chatText: ""
    });

    $('.enterPlayerBtn').on("click", function(e) {
        e.preventDefault();

        if ($('#player1Name').attr('data-status') === 'open') {
            p1username = $('.usernameField').val();
            username = p1username;
            player1 = new playerObj(p1username, con.path.ct[1], "", 0, 0, 0);
            database.ref().update({
                player1: player1,
                turn: 1
            });

            disconnected = username + ' has disconnected';
            database.ref("chat").onDisconnect().update({
                chatText: disconnected
            });

            database.ref("player1").onDisconnect().remove();
        } else if ($('#player1Name').attr('data-status') === 'taken') {
            p2username = $('.usernameField').val();
            username = p2username;

            player2 = new playerObj(p2username, con.path.ct[1], "", 0, 0, 0);
            database.ref().update({
                player2: player2,
                turn: 1
            });

            disconnected = username + ' has disconnected';
            database.ref("chat").onDisconnect().update({
                chatText: disconnected
            });
            database.ref("player2").onDisconnect().remove();
        }
    });

    $('.p1Val').on('click', function() {
        player1.choice = $(this).attr('data-value');
        database.ref("player1").update({
            choice: $(this).attr('data-value')
        });
        database.ref().update({
            turn: 2
        });
    });

    $('.p2Val').on('click', function() {
        player2.choice = $(this).attr('data-value');
        database.ref("player2").update({
            choice: $(this).attr('data-value')
        });
        database.ref().update({
            turn: 3
        });
    });

    $('#chatBtn').on('click', function(event) {
        event.preventDefault();

        chatText = username + ': ' + $('#chatField').val();
        database.ref('chat').update({
            chatText: chatText
        });
    });


    database.ref('chat').on('value', function(snapshot) {
        if (snapshot.val().chatText !== "") {
            $('#chatMessages').append('<div>' + snapshot.val().chatText + '</div>');
            $('#chatField').val("");
            // $('#chatMessages').scrollTop(-200);
        }
    });

    database.ref().on("value", function(snapshot) {

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
            $('div.chatInput').hide();
        }

        if (snapshot.child("player1").exists() && snapshot.child("player2").exists()) {

            if (snapshot.val().player1.connectionId !== connectionId) {
                if (snapshot.val().player2.connectionId !== connectionId) {
                    $('p.playerSelectUI').text('Game in Progress. You must wait for a player to leave.');
                    $('input.playerSelectUI').hide();
                    $('div.chatInput').hide();
                    $('.player1Btns').hide();
                    $('.player2Btns').hide();
                }
            }

            if (snapshot.val().turn === 1) {
                if (snapshot.val().player1.connectionId === connectionId) {
                    $('.player1Btns').show();
                } else if (snapshot.val().player2.connectionId === connectionId) {
                    $('#player2Name').append('<br>waiting for player1 to choose');
                }
            } else if (snapshot.val().turn === 2) {
                if (snapshot.val().player1.connectionId === connectionId) {
                    $('.player1Btns').hide();
                }
                if (snapshot.val().player2.connectionId === connectionId) {
                    $('.player2Btns').show();
                } else if (snapshot.val().player1.connectionId === connectionId) {
                    $('#player1Name').append('<br>waiting for player2 to choose');
                }
            } else if (snapshot.val().turn === 3) {
                $('.player2Btns').hide();
            }

            if (snapshot.val().player1.choice === snapshot.val().player2.choice &&
                snapshot.val().player1.choice !== "" && snapshot.val().player2.choice !== "") {
                $('.gameDisplay').text('you tied');
                tieGame(snapshot);
            } else if (snapshot.val().player1.choice === 'r' &&
                snapshot.val().player2.choice === 's') {

                updateWins("player1", snapshot.val().player1.wins);
                updateLosses("player2", snapshot.val().player2.losses);
                reset();
            } else if (snapshot.val().player1.choice === 'r' &&
                snapshot.val().player2.choice === 'p') {

                updateWins("player2", snapshot.val().player2.wins);
                updateLosses("player1", snapshot.val().player1.losses);
                reset();
            } else if (snapshot.val().player1.choice === 'p' &&
                snapshot.val().player2.choice === 'r') {

                updateWins("player1", snapshot.val().player1.wins);
                updateLosses("player2", snapshot.val().player2.losses);
                reset();
            } else if (snapshot.val().player1.choice === 'p' &&
                snapshot.val().player2.choice === 's') {

                updateWins("player2", snapshot.val().player2.wins);
                updateLosses("player1", snapshot.val().player1.losses);
                reset();
            } else if (snapshot.val().player1.choice === 's' &&
                snapshot.val().player2.choice === 'p') {

                updateWins("player1", snapshot.val().player1.wins);
                updateLosses("player2", snapshot.val().player2.losses);
                reset();
            } else if (snapshot.val().player1.choice === 's' &&
                snapshot.val().player2.choice === 'r') {

                updateWins("player2", snapshot.val().player2.wins);
                updateLosses("player1", snapshot.val().player1.losses);
                reset();
            }
        }
    });
}); // end $(document).ready()

// add comments to code
// all combos of win loss
// if p1 leaves on p1's turn
// if p1 leaves on p2's turn
// if p2 leave's on p1's turn
// if p2 leave's on p2's turn
// page behavior for observer during all of the above conditions
// win, loss, tie transitions
// styling & chat scroll/fix title to spot
// validate files
// deploy to git hub