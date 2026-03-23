import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDocumentTitle } from "../hooks/use-document-title";
import { RotateCcw, Loader2, Folder, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContentWrap } from "@/components/page-content-wrap/page-content-wrap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TreeNode = {
  name: string;
  kind: "folder" | "file";
  note?: string;
  children?: TreeNode[];
};

const srcTree: TreeNode[] = [
  {
    name: "api/",
    kind: "folder",
    note: "Query-/Mutation-Funktionen (TanStack Query)",
    children: [
      { name: "trains.ts", kind: "file" },
      { name: "rbcs.ts", kind: "file" },
      { name: "relations.ts", kind: "file" },
    ],
  },
  {
    name: "components/",
    kind: "folder",
    note: "Wiederverwendbare UI-Bausteine (kebab-case, Ordner pro Komponente)",
    children: [
      { name: "ui/", kind: "folder", note: "shadcn/Radix-Primitives (Button, Dialog, Table, …)" },
      { name: "app-layout/", kind: "folder" },
      { name: "form-drawer/", kind: "folder", note: "Basis-Drawer für Formulare" },
      { name: "train-form-drawer/", kind: "folder" },
      { name: "rbc-form-drawer/", kind: "folder" },
      { name: "key-form-drawer/", kind: "folder" },
      { name: "relation-matrix/", kind: "folder" },
      { name: "trains-page/", kind: "folder" },
      { name: "rbcs-page/", kind: "folder" },
      { name: "matrix-page/", kind: "folder" },
      { name: "…", kind: "folder" },
    ],
  },
  {
    name: "hooks/",
    kind: "folder",
    note: "Custom React Hooks",
    children: [
      { name: "use-document-title.ts", kind: "file" },
      { name: "use-quick-jump.ts", kind: "file" },
    ],
  },
  {
    name: "lib/",
    kind: "folder",
    note: "Framework-unabhängige Helfer",
    children: [
      { name: "mixins.ts", kind: "file", note: "wiederverwendete Tailwind-Klassen-Konstanten" },
      { name: "utils.ts", kind: "file", note: "cn()-Helper" },
    ],
  },
  {
    name: "mocks/",
    kind: "folder",
    note: "MSW-Setup (Fake-Backend im Browser)",
    children: [
      { name: "handlers.ts", kind: "file", note: "HTTP-Handler" },
      { name: "data.ts", kind: "file", note: "In-Memory-Store + localStorage-Persistenz" },
      { name: "browser.ts", kind: "file", note: "MSW worker setup" },
    ],
  },
  {
    name: "pages/",
    kind: "folder",
    note: "Seiten, geladen via React Router",
    children: [
      { name: "trains-page.tsx", kind: "file" },
      { name: "rbcs-page.tsx", kind: "file" },
      { name: "matrix-page.tsx", kind: "file" },
      { name: "settings-page.tsx", kind: "file" },
    ],
  },
  { name: "assets/", kind: "folder", note: "Statische Assets (Fonts)" },
  { name: "app.tsx", kind: "file", note: "Root-Komponente + Routing" },
  { name: "main.tsx", kind: "file", note: "Entry point, MSW-Bootstrap" },
  { name: "index.css", kind: "file", note: "Tailwind v4 + Design-Tokens (@theme)" },
  { name: "types.ts", kind: "file", note: "Domain-Typen: Train, RBC, Relation" },
];

function TreeList({ nodes }: { nodes: TreeNode[] }) {
  return (
    <ul className="space-y-0.5 pl-5 text-sm text-muted-foreground">
      {nodes.map((node) => (
        <li key={node.name}>
          <div className="flex items-start gap-1.5">
            {node.kind === "folder" ? (
              <Folder className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span className="font-mono text-db-black">{node.name}</span>
            {node.note ? (
              <span className="text-muted-foreground">— {node.note}</span>
            ) : null}
          </div>
          {node.children ? <TreeList nodes={node.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

type Endpoint = { method: "GET" | "POST" | "PUT" | "DELETE"; path: string; purpose: string };

const trainEndpoints: Endpoint[] = [
  { method: "GET", path: "/api/trains", purpose: "Alle Züge laden" },
  { method: "POST", path: "/api/trains", purpose: "Zug anlegen" },
  { method: "PUT", path: "/api/trains/:id", purpose: "Zug aktualisieren" },
  { method: "DELETE", path: "/api/trains/:id", purpose: "Zug löschen (inkl. Relationen)" },
];

const rbcEndpoints: Endpoint[] = [
  { method: "GET", path: "/api/rbcs", purpose: "Alle RBCs laden" },
  { method: "POST", path: "/api/rbcs", purpose: "RBC anlegen" },
  { method: "PUT", path: "/api/rbcs/:id", purpose: "RBC aktualisieren" },
  { method: "DELETE", path: "/api/rbcs/:id", purpose: "RBC löschen (inkl. Relationen)" },
];

const relationEndpoints: Endpoint[] = [
  { method: "GET", path: "/api/relations", purpose: "Zuordnungen laden, optional ?trainId=&rbcId=" },
  { method: "POST", path: "/api/relations", purpose: "Zuordnung anlegen ({ trainId, rbcId, key })" },
  { method: "PUT", path: "/api/relations/:trainId/:rbcId/key", purpose: "Schlüssel ändern" },
  { method: "DELETE", path: "/api/relations/:trainId/:rbcId", purpose: "Zuordnung entfernen" },
];

const utilityEndpoints: Endpoint[] = [
  { method: "GET", path: "/api/reset", purpose: "Seed-Daten wiederherstellen (vom Reset-Button oben aufgerufen)" },
];

const methodColor: Record<Endpoint["method"], string> = {
  GET: "bg-emerald-100 text-emerald-900",
  POST: "bg-blue-100 text-blue-900",
  PUT: "bg-amber-100 text-amber-900",
  DELETE: "bg-red-100 text-red-900",
};

function EndpointTable({ title, endpoints }: { title: string; endpoints: Endpoint[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-db-black">{title}</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Method</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Zweck</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {endpoints.map((e) => (
            <TableRow key={`${e.method} ${e.path}`}>
              <TableCell>
                <code className={`rounded px-1.5 py-0.5 font-mono text-xs font-bold ${methodColor[e.method]}`}>
                  {e.method}
                </code>
              </TableCell>
              <TableCell className="font-mono text-xs">{e.path}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{e.purpose}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function SettingsPage() {
  useDocumentTitle("Einstellungen");

  const [resetting, setResetting] = useState(false);
  const queryClient = useQueryClient();

  async function handleReset() {
    setResetting(true);
    try {
      await fetch("/api/reset");
      await queryClient.invalidateQueries();
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageContentWrap>
        <div className="max-w-md space-y-6 p-8">
          <div>
            <h2 className="text-lg font-bold text-db-black">Daten</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Setzt alle Züge, RBCs und Zuordnungen auf die Ausgangsdaten
              zurück.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={resetting}
          >
            {resetting ? <Loader2 className="animate-spin" /> : <RotateCcw />}
            Daten zurücksetzen
          </Button>
          <hr />
        </div>

        <div className="max-w-3xl space-y-8 p-8">
          <section>
            <h2 className="text-lg font-bold text-db-black">
              Über diese Anwendung
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Diese Anwendung dient der Verwaltung von Zügen, RBCs (Radio Block
              Centres) und deren Schlüssel-Zuordnungen. Nachfolgend ein
              Überblick über den eingesetzten Stack, die verwendeten
              Bibliotheken und die Architektur.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-db-black">Stack</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                <strong>React 19</strong> mit aktiviertem React Compiler für
                automatische Memoisierung.
              </li>
              <li>
                <strong>TypeScript</strong> für statische Typisierung im
                gesamten Projekt.
              </li>
              <li>
                <strong>Vite</strong> als Build-Tool und Entwicklungsserver mit
                Hot Module Replacement.
              </li>
              <li>
                <strong>Tailwind CSS v4</strong> für Utility-first Styling, über
                das Vite-Plugin eingebunden.
              </li>
              <li>
                <strong>pnpm</strong> als Paketmanager.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-db-black">
              Verwendete Bibliotheken
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                <strong>React Router</strong> – clientseitiges Routing für
                Seiten, Edit-Flows und Einstellungen.
              </li>
              <li>
                <strong>TanStack Query</strong> – Server-State-Management,
                Caching und Invalidierung von API-Daten.
              </li>
              <li>
                <strong>TanStack Table</strong> und{" "}
                <strong>TanStack Virtual</strong> – performante, virtualisierte
                Tabellen für große Datensätze.
              </li>
              <li>
                <strong>React Hook Form</strong> mit <strong>Zod</strong> und{" "}
                <strong>@hookform/resolvers</strong> – Formular-State und
                schema-basierte Validierung.
              </li>
              <li>
                <strong>Radix UI</strong> und <strong>shadcn/ui</strong>{" "}
                – barrierefreie, unstyled Primitives als Basis der
                UI-Komponenten.
              </li>
              <li>
                <strong>cmdk</strong> – Command-Palette- und
                Combobox-Komponenten für Filter.
              </li>
              <li>
                <strong>vaul</strong> – Drawer-Komponente für Formulare (Key-,
                RBC- und Zugverwaltung).
              </li>
              <li>
                <strong>lucide-react</strong> – Icon-Set.
              </li>
              <li>
                <strong>class-variance-authority</strong>,{" "}
                <strong>clsx</strong>, <strong>tailwind-merge</strong>{" "}
                – Utilities zum Komponieren von Tailwind-Klassen und
                Komponentenvarianten.
              </li>
              <li>
                <strong>lodash-es</strong> – Hilfsfunktionen für Datenhandling.
              </li>
              <li>
                <strong>MSW (Mock Service Worker)</strong> – API-Mocking im
                Browser für lokale Entwicklung ohne Backend.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-db-black">Ordnerstruktur</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Top-Level-Konfiguration: <code className="font-mono">vite.config.ts</code>,{" "}
              <code className="font-mono">tsconfig*.json</code>,{" "}
              <code className="font-mono">eslint.config.mjs</code>,{" "}
              <code className="font-mono">package.json</code>. Der Import-Alias{" "}
              <code className="font-mono">@/</code> zeigt auf{" "}
              <code className="font-mono">src/</code>.
            </p>
            <div className="mt-3 rounded-md border bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 text-sm font-mono text-db-black">
                <Folder className="h-3.5 w-3.5" />
                <span>src/</span>
              </div>
              <TreeList nodes={srcTree} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Datenfluss: Komponenten greifen über TanStack-Query-Hooks auf die{" "}
              <strong>api/</strong>-Schicht zu, die gegen die von MSW gemockten
              Endpunkte läuft. Formulare nutzen React Hook Form mit Zod-Schemas;
              nach erfolgreicher Mutation werden relevante Queries invalidiert,
              sodass die UI automatisch aktualisiert wird.
            </p>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-db-black">API-Endpunkte</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                MSW mockt alle Endpunkte im Browser — künstliche Latenz 200–600 ms,
                Persistenz in <code className="font-mono">localStorage</code>.
                Definiert in <code className="font-mono">src/mocks/handlers.ts</code>.
              </p>
            </div>
            <EndpointTable title="Trains" endpoints={trainEndpoints} />
            <EndpointTable title="RBCs" endpoints={rbcEndpoints} />
            <EndpointTable title="Relations" endpoints={relationEndpoints} />
            <EndpointTable title="Utility" endpoints={utilityEndpoints} />
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-bold text-db-black">Konventionen</h3>

            <div>
              <h4 className="text-sm font-bold text-db-black">Dateien & Exports</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  kebab-case Dateinamen durchgängig (
                  <code className="font-mono">train-form-drawer.tsx</code>, nicht{" "}
                  <code className="font-mono">TrainFormDrawer.tsx</code>).
                </li>
                <li>
                  Named Exports bevorzugt —{" "}
                  <code className="font-mono">export function Foo()</code> statt{" "}
                  <code className="font-mono">export default</code>.
                </li>
                <li>
                  Ordner pro Komponente:{" "}
                  <code className="font-mono">components/&lt;name&gt;/&lt;name&gt;.tsx</code>;
                  kleine Helfer (<code className="font-mono">utils.ts</code>) werden im
                  selben Ordner co-lokalisiert.
                </li>
                <li>
                  Import-Alias <code className="font-mono">@/</code> zeigt auf{" "}
                  <code className="font-mono">src/</code>.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-db-black">Formulare & Drawer</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  Basis <code className="font-mono">FormDrawer</code> (
                  <code className="font-mono">components/form-drawer/form-drawer.tsx</code>)
                  kapselt Open/Close, Dirty-Tracking, Bestätigung beim Abbrechen sowie
                  Speichern/Löschen-Aktionen.
                </li>
                <li>
                  Konkrete Formulare (<code className="font-mono">train-form-drawer</code>,{" "}
                  <code className="font-mono">rbc-form-drawer</code>,{" "}
                  <code className="font-mono">key-form-drawer</code>) kombinieren
                  <strong> react-hook-form</strong> + <strong>zod</strong> über{" "}
                  <code className="font-mono">@hookform/resolvers/zod</code> mit den
                  shadcn-<code className="font-mono">Form</code>-Primitives.
                </li>
                <li>
                  Löschen läuft über eine Render-Prop:{" "}
                  <code className="font-mono">
                    renderRemoveDialog?: (trigger: ReactNode) =&gt; ReactNode
                  </code>
                  {" "}— der Drawer rendert den Trigger, der aufrufende Code die
                  Bestätigung.
                </li>
                <li>
                  Gemeinsame Feld-Layouts kommen aus{" "}
                  <code className="font-mono">lib/mixins.ts</code> (
                  <code className="font-mono">formFieldsContainer</code>).
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-db-black">Datenzugriff</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  Dünne <code className="font-mono">fetch</code>-Wrapper in{" "}
                  <code className="font-mono">src/api/*.ts</code>; eine Datei pro
                  Ressource.
                </li>
                <li>
                  TanStack Query v5; Query-Keys als Arrays (
                  <code className="font-mono">["trains"]</code>,{" "}
                  <code className="font-mono">["relations", {"{ trainId }"}]</code>).
                </li>
                <li>
                  Mutationen invalidieren nach Erfolg die betroffenen Keys — die UI
                  aktualisiert sich automatisch.
                </li>
                <li>
                  <code className="font-mono">useSuspenseQuery</code> wird dort genutzt,
                  wo die Page-Shell bereits per Router-Loader auf Daten wartet.
                </li>
                <li>
                  Fehlerbehandlung: nicht-ok Responses werfen; UI-Fehler werden lokal
                  im Formular/Drawer angezeigt.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-db-black">Styling</h4>
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <strong>Hinweis:</strong> Styling ist in dieser Codebase bewusst
                quick-and-dirty gehalten — es gibt keine strenge
                Design-System-Abstraktion, Utility-Klassen werden häufig direkt inline
                komponiert, und einige Abstände/Farben sind pragmatisch gewählt statt
                systematisch.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  Tailwind CSS v4 via{" "}
                  <code className="font-mono">@tailwindcss/vite</code>.
                </li>
                <li>
                  Design-Tokens im <code className="font-mono">@theme</code>-Block in{" "}
                  <code className="font-mono">index.css</code> (DB-Farben:{" "}
                  <code className="font-mono">db-red</code>,{" "}
                  <code className="font-mono">db-black</code>, Focus-Blue).
                </li>
                <li>
                  <code className="font-mono">clsx</code> +{" "}
                  <code className="font-mono">tailwind-merge</code> über den{" "}
                  <code className="font-mono">cn()</code>-Helfer in{" "}
                  <code className="font-mono">lib/utils.ts</code>.
                </li>
                <li>
                  UI-Primitives aus <code className="font-mono">components/ui/</code>{" "}
                  (shadcn-Style, Radix-basiert).
                </li>
              </ul>
            </div>
          </section>
        </div>
      </PageContentWrap>
    </div>
  );
}
