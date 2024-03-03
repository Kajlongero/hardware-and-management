"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { ChangeEventHandler, useState } from "react";

type Props = {
  full?: boolean;
  hideOn?: "only-small-mobile" | "only-mobile" | "only-tablet";
};

type Focused = {
  focused: boolean;
  mouseFocus: boolean;
};

export const Search = ({ full, hideOn }: Props) => {
  const navigate = useRouter();

  const [focused, setFocused] = useState<Focused>({
    focused: false,
    mouseFocus: false,
  });
  const [search, setSearch] = useState<string>("");

  const handleSearch: ChangeEventHandler<HTMLInputElement> = (e) =>
    setSearch(e.target.value);

  return (
    <div
      className={`flex items-center ${!!hideOn ? `${hideOn}:hidden` : ""} ${
        focused.focused || focused.mouseFocus ? "bg-dark-3a" : "bg-dark-1a"
      } ${
        full ? "flex-1 w-full" : "w-40"
      } rounded-md relative transition-colors`}
      onMouseEnter={() => setFocused((p) => ({ ...p, mouseFocus: true }))}
      onMouseLeave={() => setFocused((p) => ({ ...p, mouseFocus: false }))}
    >
      <input
        className="w-full px-4 py-1 bg-transparent text-sm text-white outline-none"
        onChange={handleSearch}
        placeholder="Search products"
        value={search}
        onFocus={() => setFocused((p) => ({ ...p, focused: true }))}
        onBlur={() => setFocused((p) => ({ ...p, focused: false }))}
        onKeyDown={(e) => {
          if (
            search.length > 0 &&
            ["Enter", "NumpadEnter"].includes(e.code) &&
            focused.focused
          )
            navigate.push(`/products?s=${search}`, { scroll: false });
        }}
      />
      <MagnifyingGlassIcon
        className="absolute right-2 w-4 h-4 cursor-pointer z-10"
        onClick={() => {
          if (search.length > 0)
            navigate.push(`/products?s=${search}`, { scroll: false });
        }}
      />
    </div>
  );
};
