import Link from "next/link";
import { landingLeftNavroutes } from "@/utils/navroutes";
import { ItemsContainer } from "./ItemsContainer";
import { Items } from "./Items";
import { Search } from "../Search";
import { IconsContainer } from "./IconsContainer";

export const Navbar = () => {
  return (
    <header className="fixed top-0 w-full bg-dark-0a text-white">
      <nav className="w-full px-4 py-3 md:px-6 md:py-4 lg:px-8 lg:py-6">
        <ItemsContainer position="left">
          <Link href="/" className="text-xs">
            DudesSoftware
          </Link>
          <Items user={null} data={landingLeftNavroutes} />
          <ItemsContainer position="right">
            <Search full hideOn="only-small-mobile" />
            <IconsContainer user={null} />
          </ItemsContainer>
        </ItemsContainer>
      </nav>
    </header>
  );
};
