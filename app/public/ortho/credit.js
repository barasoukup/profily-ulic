// The credit line of an orthophoto of the registry in the language of the page (credit-text.js): by the key of its credit, or in the
// holder's own words after "orthophoto" (the Länder's, Turin's); `forMap` the credit of its layer on the map where that differs.
import { creditText, W, lead } from "../credit-text.js";

export const orthoCredit = (s, forMap = false) => {
  const key = (forMap && s.mapCredit) || s.credit;
  return key ? creditText(key) : lead(W("orthophoto"), s.creditWho);
};
