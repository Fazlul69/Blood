export type BloodGroup = "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "AB_POS" | "AB_NEG" | "O_POS" | "O_NEG";

export const BLOOD_GROUP_LABELS: Record<BloodGroup, string> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
};

export interface User {
  id: number;
  phone: string;
  username: string;
  name: string;
  gender: string | null;
  bloodGroup: BloodGroup;
  photoUrl: string | null;
  lat: number | null;
  lng: number | null;
  addressText: string | null;
  showPhone: boolean;
  allowChat: boolean;
  lastDonationDate: string | null;
  lastAntibioticDate: string | null;
  role: "user" | "admin";
  status: "active" | "banned";
  createdAt: string;
}

export interface DonorWithStatus extends User {
  isActive: boolean;
}

export interface AppSetting {
  key: string;
  value: string;
}
