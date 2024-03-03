import Link from "next/link";

type Props = {
  user: Employee | Customer | null;
};

import {
  Cog8ToothIcon,
  UserCircleIcon,
  Bars2Icon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { Customer, Employee } from "@/interfaces/user-model";

export const IconsContainer = ({ user }: Props) => {
  return (
    <div className="flex gap-4">
      <ShoppingCartIcon
        className={`w-6 h-6 only-mobile:hidden ${!user ? "hidden" : ""}`}
      />
      <Link
        href={user ? "/user/account" : "/auth/"}
        className={`only-mobile:hidden`}
      >
        <UserCircleIcon className="w-6 h-6" />
      </Link>
      <Link
        className={`${user ? "" : "hidden"} only-mobile:hidden`}
        href="/customer/orders"
      ></Link>
      <Link
        href={user ? "/user/configuration" : "/"}
        className={`${user ? "" : "hidden"} only-mobile-hidden`}
      >
        <Cog8ToothIcon className="w-6 h-6" />
      </Link>
      <Bars2Icon className="w-6 h-6 only-mobile:block hidden" />
    </div>
  );
};
