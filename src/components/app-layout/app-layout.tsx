import { KeyRound, Grid3x3, Radio, Settings, Train } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import {
  DocumentTitleContext,
  useDocumentTitleManager,
} from "@/hooks/use-document-title";

const navItems = [
  { to: "/matrix", icon: Grid3x3, label: "Matrix", additionalClass: "" },
  { to: "/trains", icon: Train, label: "Züge", additionalClass: "" },
  { to: "/rbcs", icon: Radio, label: "RBCs", additionalClass: "" },
  {
    to: "/settings",
    icon: Settings,
    label: "Einstellungen",
    additionalClass: "ml-auto",
  },
];

export default function AppLayout() {
  const push = useDocumentTitleManager();

  return (
    <DocumentTitleContext.Provider value={push}>
      <div className="flex h-screen flex-col bg-db-light-grey">
        <header className="sticky top-0 z-50 flex items-center bg-db-white border-b border-border">
          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            className="absolute left-4 text-lg font-bold text-db-black flex flex-row items-center gap-0.5 cursor-pointer"
          >
            KEY
            <div className="aspect-square bg-db-red/10 rounded-full size-[1.5em] items-center justify-center flex">
              <KeyRound className="size-[1em] stroke-db-red overflow-visible" />
            </div>
            LOK
          </button>
          <nav className="ml-40 mr-4 flex flex-1">
            {navItems.map(({ to, icon: Icon, label, additionalClass }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `tracking-wide font-bold flex items-center gap-2 px-5 py-5 text-base border-b-3 transition-colors ${additionalClass} ${
                    isActive
                      ? "border-db-red text-db-red"
                      : "border-transparent text-text-db-black/80 hover:text-db-black"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="flex min-h-0 flex-1 flex-col p-6 bg-db-black/5">
          <Outlet />
        </main>
      </div>
    </DocumentTitleContext.Provider>
  );
}
