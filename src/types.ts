export interface Train {
  id: string;
  trainType: string;
  trainNumber: string;
  operator: string;
  notes: string;
}

export function getTrainDisplayName(train: Train): string {
  return `${train.trainType} ${train.trainNumber}`.trim();
}

export type RBCStatus = "operational" | "maintenance" | "decommissioned";

export interface RBC {
  id: string;
  name: string;
  location: string;
  manufacturer: string;
  status: RBCStatus;
  notes: string;
}

export interface Relation {
  trainId: string;
  rbcId: string;
  key: string;
}
