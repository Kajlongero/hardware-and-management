import NavLink from "next/link";

export const LandingNavbar = () => {
  return (
    <header className="sticky top-0 z-20 w-full flex flex-col md:flex-row md:items-center gap-3 p-3 lg:px-8 md:h-16 supports-[backdrop-filter]:bg-white/60 bg-white/95 backdrop-blur text-lg">
      <nav className="w-full flex items-center gap-8">
        <div className="flex items-center gap-4">
          <NavLink
            href="/"
            className="border border-slate-300 px-3 py-1 rounded-md"
          >
            Home
          </NavLink>
          <NavLink
            href="/products"
            className="border border-slate-300 px-3 py-1 rounded-md"
          >
            Products
          </NavLink>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <NavLink
            href="/login"
            className="border border-slate-300 px-3 py-1 rounded-md border-b-2"
          >
            Sign in
          </NavLink>
          <NavLink
            href="/signup"
            className="border border-slate-300 px-3 py-1 rounded-md border-b-2"
          >
            Sign up
          </NavLink>
          {false && (
            <div>
              <figure>
                <img src="null" alt="" />
              </figure>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
