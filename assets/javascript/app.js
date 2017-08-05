var con;
var p1username;
var p2username;
var player;
var connectionId;
var turn;
var player1;
var player2;

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

// push comments to chat window and have overflow:scroll for overflow?
// update turn=1 and push to fb on disconnect
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
    $('.player1Btns, .player1Stats, .player2Btns, .player2Stats').hide();
    // monitor connected parties on fb db
    connectedRef.on("value", function(snap) {
        if (snap.val()) {
            con = connectionsRef.push(true);
            connectionId = con.path.ct[1];
            // console.log(con);
            con.onDisconnect().remove();
        }
    });

    $('.enterPlayerBtn').on("click", function(e) {
        e.preventDefault();

        if ($('#player1Name').attr('data-status') === 'open') {
            p1username = $('.usernameField').val();
            $('p.playerSelectUI').text("Welcome " + p1username + ". You are Player 1");
            $('input.playerSelectUI').hide();
            $('#player1Name').text(p1username);
            // function playerObj(username, , connectionId, choice, wins, losses, ties)
            player1 = new playerObj(p1username, con.path.ct[1], "", 0, 0, 0);
            database.ref().update({
                player1: player1,
                turn: 1
            });
            database.ref("player1").onDisconnect().remove();
        } else if ($('#player1Name').attr('data-status') === 'taken') {
            $('#player2Name').attr('data-status', 'taken');
            p2username = $('.usernameField').val();
            $('p.playerSelectUI').text("Welcome " + p2username + ". You are Player 2");
            $('input.playerSelectUI').hide();
            $('#player2Name').text(p2username);
            $('.player2Stats').show();
            // function playerObj(username, choice, wins, losses, ties)
            player2 = new playerObj(p2username, con.path.ct[1], "", 0, 0, 0);
            database.ref().update({
                player2: player2,
                turn: 1
            });
            database.ref("player2").onDisconnect().remove();
        }
    });

    database.ref().on("value", function(snapshot) {
        console.log(snapshot.val());
        if (snapshot.child("player1").exists()) {
            $('#player1Name').attr('data-status', 'taken');
            $('#player1Name').text(snapshot.val().player1.username);
            // make this a function
            $('#player1Name').text(p1username);
            $('#player1Wins').text(snapshot.val().player1.wins);
            $('#player1Losses').text(snapshot.val().player1.losses);
            $('#player1Ties').text(snapshot.val().player1.ties);
            //
            $('.player1Stats').show();
        }

        if (!snapshot.child("player1").exists()) {
            $('#player1Name').attr('data-status', 'open')
                .text("Waiting for Player 1...");
            $('.player1Stats').hide();
            $('.player2Btns').hide();
            if (connectionId !== snapshot.val().player2.connectionId) {
                $('.playerSelectUI').show();
            }
        }

        if (snapshot.child("player2").exists()) {
            $('#player2Name').attr('data-status', 'taken');
            $('#player2Name').text(snapshot.val().player2.username);

            $('#player2Name').text(p2username);
            $('#player2Wins').text(snapshot.val().player2.wins);
            $('#player2Losses').text(snapshot.val().player2.losses);
            $('#player2Ties').text(snapshot.val().player2.ties);

            $('.player2Stats').show();
        }

        if (!snapshot.child("player2").exists()) {
            $('#player2Name').attr('data-status', 'open')
                .text("Waiting for Player 2...");
            $('.player2Stats').hide();
            $('.player1Btns').hide();
            if (connectionId !== snapshot.val().player1.connectionId) {
                $('.playerSelectUI').show();
            }
        }
        if (snapshot.child("player1").exists() && snapshot.child("player2").exists()) {
            if (snapshot.val().player1.connectionId !== connectionId &&
                snapshot.val().player2.connectionId !== connectionId) {
                $('.playerSelectUI').hide();
            }
            if (snapshot.val().turn === 1) {
                //player 2 message
                if (snapshot.val().player1.connectionId === connectionId) {
                    $('.player1Btns').show();
                    $('button.input').on('click', function() {
                        player1.choice = $(this).attr('data-value');
                        database.ref("player1").update({
                            choice: $(this).attr('data-value')
                        });
                        database.ref().update({
                            turn: 2
                        });
                        $('.player1Btns').hide();
                    });
                } else if (snapshot.val().player2.connectionId === connectionId) {
                    $('#player2Name').append('<br>waiting for player1 to choose');
                }
            } else if (snapshot.val().turn === 2) {
                if (snapshot.val().player2.connectionId === connectionId) {
                    $('.player2Btns').show();
                    $('button.input').on('click', function() {
                        player2.choice = $(this).attr('data-value');
                        database.ref("player2").update({
                            choice: $(this).attr('data-value')
                        });
                        $('.player2Btns').hide();
                        database.ref().update({
                            turn: 3
                        });
                    });
                } else if (snapshot.val().player1.connectionId === connectionId) {
                    $('#player1Name').append('<br>waiting for player2 to choose');
                }
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