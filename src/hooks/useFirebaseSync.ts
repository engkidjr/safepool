import { useEffect, useRef } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { useApp } from "../lib/store";

export function useFirebaseSync() {
  const cloudSync = useApp((s) => s.cloudSync);
  const setCloudSync = useApp((s) => s.setCloudSync);
  const lastSyncedStateRef = useRef("");

  // Listen to auth state changes and bind Firestore listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const state = useApp.getState();
      if (
        user &&
        state.cloudSync.linked &&
        state.cloudSync.provider === "firebase"
      ) {
        const docRef = doc(db, "users", user.uid);
        unsubscribeSnapshot = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as any;
              const currentState = useApp.getState();

              const isDifferent =
                data.balance !== currentState.balance ||
                data.vault !== currentState.vault ||
                data.goal !== currentState.goal ||
                JSON.stringify(data.transactions) !==
                  JSON.stringify(currentState.transactions) ||
                JSON.stringify(data.recurringPayments) !==
                  JSON.stringify(currentState.recurringPayments) ||
                JSON.stringify(data.incomeCategories) !==
                  JSON.stringify(currentState.incomeCategories) ||
                JSON.stringify(data.expenseCategories) !==
                  JSON.stringify(currentState.expenseCategories) ||
                data.passcodeHash !== currentState.passcodeHash;

              if (isDifferent) {
                const syncPayload = {
                  balance: data.balance ?? 0,
                  vault: data.vault ?? 0,
                  goal: data.goal ?? 0,
                  transactions: data.transactions ?? [],
                  recurringPayments: data.recurringPayments ?? [],
                  incomeCategories:
                    data.incomeCategories ?? currentState.incomeCategories,
                  expenseCategories:
                    data.expenseCategories ?? currentState.expenseCategories,
                  currency: data.currency ?? currentState.currency,
                  passcodeHash:
                    data.passcodeHash !== undefined
                      ? data.passcodeHash
                      : currentState.passcodeHash,
                };

                lastSyncedStateRef.current = JSON.stringify(syncPayload);

                useApp.setState(syncPayload);

                setCloudSync({
                  lastSync: new Date().toISOString(),
                });
              }
            }
          },
          (err) => {
            console.error("Firestore real-time subscription error:", err);
          }
        );
      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [cloudSync.linked, cloudSync.provider, setCloudSync]);

  // Subscribe to local Zustand changes and upload to Firestore
  useEffect(() => {
    if (typeof window === "undefined") return;

    const unsubscribe = useApp.subscribe((state) => {
      if (
        state.cloudSync.linked &&
        state.cloudSync.provider === "firebase" &&
        auth.currentUser
      ) {
        const user = auth.currentUser;
        const docRef = doc(db, "users", user.uid);

        const syncPayload = {
          balance: state.balance,
          vault: state.vault,
          goal: state.goal,
          transactions: state.transactions,
          recurringPayments: state.recurringPayments,
          incomeCategories: state.incomeCategories,
          expenseCategories: state.expenseCategories,
          currency: state.currency,
          passcodeHash: state.passcodeHash,
        };

        const payloadStr = JSON.stringify(syncPayload);
        if (payloadStr !== lastSyncedStateRef.current) {
          lastSyncedStateRef.current = payloadStr;

          setDoc(docRef, {
            ...syncPayload,
            lastUpdated: new Date().toISOString(),
          }).catch((err) => {
            console.error("Auto sync to Firestore failed:", err);
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
