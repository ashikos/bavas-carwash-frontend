/**
 * Business and bank details printed on invoices.
 *
 * Taken from the invoice template the client supplied. Kept here rather than in
 * the database because there is no settings screen yet — when the admin module
 * grows one, this is the thing it should edit.
 */
export const BUSINESS = {
  name: "BAVAS CAR WASH & POLLUTION CENTRE",
  address: "TKS Puram , Kottapuram PO, Kodungallur, 9037583733",
  bank: {
    name: "SOUTH INDIAN BANK, KODUNGALLUR",
    accountNo: "0020073000010434",
    ifsc: "SIBL0000020",
    holder: "BAVAS POLLUTION TESTING CENTRE",
  },
} as const;
