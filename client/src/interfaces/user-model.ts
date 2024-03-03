enum DniTypes {
  V,
  J,
  K,
  P,
}

type WorkDays = "SUNDAY" | "MONDAY" | "THUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
type Charge = "CUSTOMER_SERVICE" | "INVENTORY_MANAGER" | "SELLER" | "CLEANER" | "ADMINISTRATIVE";

type Base = {
  id: number;
  firstName: string;
  lastName: string;
  address: string;
  dni: number;
  dniType: DniTypes;
  createdAt: string;
  updatedAt: string;
  birthDate?: string;
  authId: number;
  auth: User;
}

export type Customer = {
  balance: number;  
} & Base;

export type Employee = {
  salary: number;
  workDays: WorkDays[];
  charge: Charge;
  isActive: boolean;
} & Base;

export interface User {
  id: string;                                   
  email: string;                             
  userRoles: string;                     
  createdAt: string;                
  updatedAt: string;                
  deletedAt: string;                
}
