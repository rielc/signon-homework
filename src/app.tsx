import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/app-layout/app-layout";
import MatrixPage from "./pages/matrix-page";
import RBCsPage from "./pages/rbcs-page";
import TrainsPage from "./pages/trains-page";
import { TrainFormDrawer } from "./components/train-form-drawer/train-form-drawer";
import { RBCFormDrawer } from "./components/rbc-form-drawer/rbc-form-drawer";
import SettingsPage from "./pages/settings-page";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/trains" element={<TrainsPage />}>
              <Route path="new" element={<TrainFormDrawer />} />
              <Route path="edit/:id" element={<TrainFormDrawer />} />
            </Route>
            <Route path="/rbcs" element={<RBCsPage />}>
              <Route path="new" element={<RBCFormDrawer />} />
              <Route path="edit/:id" element={<RBCFormDrawer />} />
            </Route>
            <Route path="/matrix" element={<MatrixPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/matrix" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
