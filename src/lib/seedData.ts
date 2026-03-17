import { LedgerEntry } from "@/types/entry";

const DATE = "2026-03-09";
const TS = "2026-03-09T00:00:00.000Z";

function e(id: number, name: string, amount: number, notes = ""): LedgerEntry {
  return {
    id: `seed-${String(id).padStart(2, "0")}`,
    name,
    amount,
    status: "Pending",
    notes,
    order: id,
    createdAt: TS,
    updatedAt: TS,
  };
}

export const SEED_DATA: LedgerEntry[] = [
  e(1, "Green pay 1st", 11146),
  e(2, "Green pay 2nd", 875),
  e(3, "Green pay 3rd", 3967),
  e(4, "xpresspay 1st", 894),
  e(5, "xpresspay 2nd", 4175),
  e(6, "pay Insta", 2240),
  e(7, "pay Switch", 2259),
  e(8, "pay MaMa", 1448),
  e(9, "pay Jas Yatra 1st", 44205),
  e(10, "pay Jas yatra 2nd", 7754),
  e(11, "Finkedi 1st", 4226),
  e(12, "Finkedi 2nd", 7248),
  e(13, "Mana Recharge", 266),
  e(14, "Mos", 3233),
  e(15, "Ishapay", 1652),
  e(16, "DMT", 9098),
  e(17, "pay Nidhi", 10049),
  e(18, "Nithin", 34630),
  e(19, "Basha", 139100),
  e(20, "Charan", 12528),
  e(21, "Aueesh", 2600),
  e(22, "pay Jas pending", 87230),
  e(23, "Hari goud", 22000),
  e(24, "Hari Shankar", 3500),
  e(25, "Sunil", 2960),
  e(26, "Biksham", 70000),
  e(27, "MaMa", 16700),
  e(28, "praveen Berra", 10590),
  e(29, "Mallala Venkatesh", 2000),
  e(30, "Rajendra kumar", 2500),
  e(31, "Sharath", 9000),
  e(32, "Satyajith Ray", 5760),
  e(33, "Turaga Srinivas", 3700),
  e(34, "Sharah", 1500),
  e(35, "Shop-2", 1967),
  e(36, "Ashok saloon", 10000),
  e(37, "Laptop", 20000),
  e(38, "Narsimha", 2000),
  e(39, "Manideep", 2800),
  e(40, "Satya buppam", 8500),
  e(41, "Krishna", 4715),
  e(42, "Ravindhups", 5000),
  e(43, "Ratna babu", 5800),
  e(44, "phone pay (4500+19250+1500+53000)", 78250, "Breakdown: 4500 + 19250 + 1500 + 53000"),
];
