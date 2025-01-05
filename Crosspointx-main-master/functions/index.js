const { debug, info } = require("firebase-functions/logger");
const { onCall } = require("firebase-functions/v2/https");

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

// The admin-sdk needs to be initizlied before doing anything
initializeApp();

/**
 * Creates a new user using their provided email address and password and
 * assigns them a playerID. PlayerIDs are assigned sequentially.
 */
exports.userSignUp = onCall(async (request, context) => {
  info("New SignUp for " + request.data.email);

  // Create User
  const userRecord = await getAuth().createUser({
    email: request.data.email,
    password: request.data.password,
  });

  info("Created user: " + userRecord.uid);
  debug(userRecord);

  // Start a transaction to update all firestore values atomically
  const playerID = await getFirestore().runTransaction(async (transaction) => {
    let currentPlayerID;

    // Get a reference to where the last used playerID is
    let playerIDsRef = getFirestore()
      .collection("systemState")
      .doc("playerIDs");

    // TODO: We likely want to give the user their ID after they have made their
    //       payment via stripe. So this firestore transaction may need to be
    //       moved to its own function in the future.
    return transaction.get(playerIDsRef).then((doc) => {
      if (doc.exists) {
        const lastPlayerID = doc.get("lastPlayerID") || "Z999";
        debug("Last playerID: " + lastPlayerID);

        let letter = lastPlayerID.substring(0, 1);
        let number = parseInt(lastPlayerID.substring(1));

        debug("letter: " + letter);
        debug("number: " + number);

        // Increment the playerID.
        // playerIDs consist of one letter and three digits.
        // FIXME: This *should* be replaced with a better system (the
        //        people above us don't seem to want to let go of this
        //        system), we could have holes in the playerID system if a
        //        player's account is deleted and if we exhaust all
        //        possible playerIDs, it isn't clear what should happen.
        //        Currently we just wrap around but this would cause
        //        duplicates.
        if (++number === 1000) {
          number = 0;
          if (letter === "Z") letter = "A";
          else letter = String.fromCharCode(letter.charCodeAt(0) + 1);
        }

        currentPlayerID = letter + number.toString().padStart(3, "0");

        // Save the just used playerID as the lastPlayerID
        transaction.update(playerIDsRef, {
          lastPlayerID: currentPlayerID,
        });
      } else {
        currentPlayerID = "A000";
        transaction.create(playerIDsRef, { lastPlayerID: currentPlayerID });
      }

      info(userRecord.uid + "was assigned: " + currentPlayerID);

      // Get a reference to the user's document
      let usersDocRef = getFirestore().collection("users").doc(userRecord.uid);

      // Create the association between user and their playerID
      transaction.create(usersDocRef, { playerID: currentPlayerID });

      debug("Associated " + userRecord.uid + " and " + currentPlayerID);

      return currentPlayerID;
    });
  });

  return { uid: userRecord.uid, playerID: playerID };
});
