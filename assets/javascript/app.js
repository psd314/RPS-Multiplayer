var player1 = new player(1, "", 0, 0, 0);
var player2 = new player(2, "", 0, 0, 0);


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

function player(id, choice, wins, losses, ties) {
    this.id = id,
        this.choice = choice,
        this.wins = wins,
        this.losses = losses,
        this.ties = ties
}

function resetPlayerChoice() {
    player1.choice = "";
    player2.choice = "";

    database.ref().set({
        player1Choice: player1.choice,
        player2Choice: player2.choice
    });
}

function updatePlayerHtml(player) {
    $('#player' + player.id + 'Wins').html(player.wins);
    $('#player' + player.id + 'Losses').html(player.losses);
    $('#player' + player.id + 'Ties').html(player.ties);
}

function writeResults() {
    updatePlayerHtml(player1);
    updatePlayerHtml(player2);
}

$(document).ready(function() {
    resetPlayerChoice();
    console.log(player1);
    console.log(player2);
    writeResults();

    connectedRef.on("value", function(snap) {

        // If they are connected..
        if (snap.val()) {

            // Add user to the connections list.
            var con = connectionsRef.push(true);
            console.log(con);

            // Remove user from the connection list when they disconnect.
            con.onDisconnect().remove();
        }
    });

    // get user input and set in fb
    $('.input').on('click', function() {

        if ($(this).attr("data-name") === 'player1Choice') {
            player1.choice = $(this).attr('data-value');

            database.ref().set({
                player1Choice: player1.choice,
                player2Choice: player2.choice
            });
        } else {
            player2.choice = $(this).attr('data-value');

            database.ref().set({
                player1Choice: player1.choice,
                player2Choice: player2.choice
            });
        }
    });
    // fb listener
    database.ref().on("value", function(snapshot) {
        fbObj = snapshot.val();
        console.log(fbObj);

        if (fbObj.player1Choice === fbObj.player2Choice && fbObj.player1Choice !== "" && fbObj.player2Choice !== "") {
            player1.ties++;
            player2.ties++;
            resetPlayerChoice();
            writeResults();
        } else if (fbObj.player1Choice === 'r' && fbObj.player2Choice !== "") {
            if (fbObj.player2Choice === 's') {
                player1.wins++;
                player2.losses++;
                resetPlayerChoice();
                writeResults();
            } else {
                player1.losses++;
                player2.wins++;
                resetPlayerChoice();
                writeResults();
            }
        } else if (fbObj.player1Choice === 'p' && fbObj.player2Choice !== "") {
            if (fbObj.player2Choice === 'r') {
                player1.wins++;
                player2.losses++;
                resetPlayerChoice();
                writeResults();
            } else {
                player1.losses++;
                player2.wins++;
                resetPlayerChoice();
                writeResults();
            }
        } else if (fbObj.player1Choice === 's' && fbObj.player2Choice !== "") {
            if (fbObj.player2Choice === 'p') {
                player1.wins++;
                player2.losses++;
                resetPlayerChoice();
                writeResults();
            } else {
                player1.losses++;
                player2.wins++;
                resetPlayerChoice();
                writeResults();
            }
        }




        // If any errors are experienced, log them to console.
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    }); // end database.ref() fb listener
}); // end $(document).ready()

// enter username, set var in fb to watch id? and disable input
// check both p's have chosen name
// get p's input and disable
// check for both p's choosing input
// compare and update wins, losses and ties
// push comments to chat window and have scroll for overflow?