import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "@firebase/firestore";
import { FIREBASE_STORE } from "./firebase";

/**
 * Return the playerID when given the UserID created by Firebase
 */
const getPlayerID = async (uid) => {
  const userDoc = await getDoc(doc(FIREBASE_STORE, "users", uid));
  if (userDoc.exists) return await userDoc.data().playerID;
};

/**
 * Returns the uid when given the playerID that we generated
 */
const getUserID = async (playerID) => {
  const queryResults = await getDocs(
    query(
      collection(FIREBASE_STORE, "users"),
      where("playerID", "==", playerID),
      limit(1),
    ),
  );

  // There should only ever be one result
  if (queryResults.docs) return queryResults.docs[0].id;
};

export { getPlayerID, getUserID };
