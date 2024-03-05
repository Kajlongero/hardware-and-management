import { Roles } from "./roles-model";

export type ValidRoutes = '/' 
| '/auth' 
| '/customers/login' 
| '/customers/signup' 
| '/employees/login'
| '/employees'
| '/products'
| '/categories'
| ''; 

export interface NavLinks {
  id?: string;
  path: string;
  pathname: string;
  key: string;
  isPublic: boolean;
  needsAccount: boolean;
  authorizedOnly?: Roles[];
  notVisibleOn?: ValidRoutes[];
} 


