import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/polymet/layouts/app-layout";
import HomePage from "@/polymet/pages/home";
import SheetsPage from "@/polymet/pages/sheets";
import SetlistsPage from "@/polymet/pages/setlists";
import SheetEditorPage from "@/polymet/pages/sheet-editor";
import SetlistViewPage from "@/polymet/pages/setlist-view";
import NewSheetPage from "@/polymet/pages/sheet-new";
import NewSetlistPage from "@/polymet/pages/setlist-new";

export default function BandSheetsPrototype() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout>
              <HomePage />
            </AppLayout>
          }
        />
        <Route
          path="/sheets"
          element={
            <AppLayout>
              <SheetsPage />
            </AppLayout>
          }
        />
        <Route
          path="/setlists"
          element={
            <AppLayout>
              <SetlistsPage />
            </AppLayout>
          }
        />
        <Route
          path="/sheet/:sheetId"
          element={
            <AppLayout>
              <SheetEditorPage />
            </AppLayout>
          }
        />
        <Route
          path="/sheet/new"
          element={
            <AppLayout>
              <NewSheetPage />
            </AppLayout>
          }
        />
        <Route
          path="/setlist/:setlistId"
          element={
            <AppLayout>
              <SetlistViewPage />
            </AppLayout>
          }
        />
        <Route
          path="/setlist/new"
          element={
            <AppLayout>
              <NewSetlistPage />
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}
