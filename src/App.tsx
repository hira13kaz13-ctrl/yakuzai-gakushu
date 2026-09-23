import { useState } from "react";
import { Shell } from "./components/Shell";
import { Home } from "./pages/Home";
import { Zukan } from "./pages/Zukan";
import { NameQuiz } from "./pages/NameQuiz";
import { MemoryGame } from "./pages/MemoryGame";
import { TreatmentQuiz } from "./pages/TreatmentQuiz";
import { PriceHighLow } from "./pages/PriceHighLow";

type Page =
  | "home"
  | "zukan"
  | "name-quiz"
  | "memory"
  | "treatment-policy"
  | "treatment-drug"
  | "price-hl";

const TITLES: Record<Page, string | undefined> = {
  home: undefined,
  zukan: "薬剤図鑑",
  "name-quiz": "薬剤名クイズ",
  memory: "神経衰弱",
  "treatment-policy": "治療選択（方針）",
  "treatment-drug": "治療選択（薬剤）",
  "price-hl": "薬価 High / Low",
};

export default function App() {
  const [page, setPage] = useState<Page>("home");

  return (
    <Shell
      title={TITLES[page]}
      showBack={page !== "home"}
      onBack={() => setPage("home")}
    >
      {page === "home" ? (
        <Home
          onSelect={(modeId) => {
            if (modeId === "zukan") setPage("zukan");
            if (modeId === "name-quiz") setPage("name-quiz");
            if (modeId === "memory") setPage("memory");
            if (modeId === "treatment-policy") setPage("treatment-policy");
            if (modeId === "treatment-drug") setPage("treatment-drug");
            if (modeId === "price-hl") setPage("price-hl");
          }}
        />
      ) : null}
      {page === "zukan" ? <Zukan /> : null}
      {page === "name-quiz" ? <NameQuiz onHome={() => setPage("home")} /> : null}
      {page === "memory" ? <MemoryGame onHome={() => setPage("home")} /> : null}
      {page === "treatment-policy" ? (
        <TreatmentQuiz variant="policy" onHome={() => setPage("home")} />
      ) : null}
      {page === "treatment-drug" ? (
        <TreatmentQuiz variant="drug" onHome={() => setPage("home")} />
      ) : null}
      {page === "price-hl" ? (
        <PriceHighLow onHome={() => setPage("home")} />
      ) : null}
    </Shell>
  );
}
