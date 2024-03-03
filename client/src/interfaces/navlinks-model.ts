import { Roles } from "./roles-model";

export interface NavLinks {
  id?: string;
  path: string;
  pathname: string;
  key: string;
  isPublic: boolean;
  needsAccount: boolean;
  authorizedOnly?: Roles[];
} 


