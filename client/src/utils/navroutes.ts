import { NavLinks } from "@/interfaces/navlinks-model";

export const landingLeftNavroutes: NavLinks[] = [
  {
    path: '/customers/dashboard',
    pathname: 'Dashboard',
    needsAccount: true,
    isPublic: false,
    authorizedOnly: ['CUSTOMER'],
    key: `landing-navroute-dashboard-customer`,
  },
  {
    path: '/employee/dashboard',
    pathname: 'Dashboard',
    needsAccount: true,
    isPublic: false,
    authorizedOnly: ['EMPLOYEE', 'OWNER'],
    key: `landing-navroute-dashboard-employee`,
  },
  {
    path: '/customers',
    pathname: 'Customers',
    needsAccount: false,
    isPublic: true,
    key: `landing-navroute-customers`,
  },
  {
    path: '/employees',
    pathname: 'Employees',
    needsAccount: false,
    isPublic: true,
    key: `landing-navroute-employees`,
  },
  {
    path: '/store/products',
    pathname: 'Products',
    needsAccount: false,
    isPublic: true,
    key: `landing-navroute-products`,
  },
] 