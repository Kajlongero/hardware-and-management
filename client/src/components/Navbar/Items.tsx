import Link from "next/link";
import { headers } from "next/headers";
import { NavLinks, ValidRoutes } from "@/interfaces/navlinks-model";
import { Customer, Employee } from "@/interfaces/user-model";
import { Roles } from "@/interfaces/roles-model";

type Props = {
  data: NavLinks[];
  user: Employee | Customer | null;
};

const Item = ({
  key,
  path,
  pathname,
}: Pick<NavLinks, "key" | "path" | "pathname">) => {
  return (
    <li key={key} className="text-xs">
      <Link href={path}>{pathname}</Link>
    </li>
  );
};

export const Items = ({ user, data }: Props) => {
  const headersList = headers();
  const pathname = headersList.get("next-url");

  return (
    <ul className="flex gap-4 only-tablet:hidden">
      {data.map(
        ({
          key: itemKey,
          path,
          pathname,
          isPublic,
          needsAccount,
          authorizedOnly,
          notVisibleOn,
        }) => {
          if (notVisibleOn?.includes(pathname as ValidRoutes)) return null;
          if (!user && !isPublic && needsAccount) return null;
          if (
            user &&
            !isPublic &&
            needsAccount &&
            authorizedOnly?.includes(user.auth.userRoles as Roles)
          )
            return <Item pathname={pathname} path={path} key={itemKey} />;

          return <Item pathname={pathname} path={path} key={itemKey} />;
        }
      )}
    </ul>
  );
};
