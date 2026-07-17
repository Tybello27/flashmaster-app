import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppState, loadState, saveState, recomputeBadges } from "./lib";
import { useTheme, Toast, useToast } from "./components";
import {
  Ctx, Route, Onboarding, Home, Decks, DeckDetail, CreateOrEditDeck, AddOrEditCard,
  StudyDeck, QuizDeck, StudyHub, Progress, Profile, Settings,
} from "./pages";

type Tab = "home" | "decks" | "study" | "progress" | "profile";

function tabOf(route: Route): Tab {
  switch (route.name) {
    case "home": case "onboarding": return "home";
    case "decks": case "deck": case "create": case "editDeck": case "addCard": case "editCard": return "decks";
    case "study": case "studyDeck": case "quizDeck": return "study";
    case "progress": return "progress";
    case "profile": case "settings": return "profile";
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [stack, setStack] = useState<Route[]>(() => {
    const initial: Route = loadState().onboardingDone ? { name: "home" } : { name: "onboarding" };
    return [initial];
  });
  const { msg, show, fire } = useToast();
  useTheme(state.settings.darkMode);

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    setState((s) => {
      const b = recomputeBadges(s);
      if (b.length === s.badges.length && b.every((x, i) => x === s.badges[i])) return s;
      const newly = b.filter((x) => !s.badges.includes(x));
      if (newly.length > 0) setTimeout(() => fire(`🏆 New badge unlocked!`), 200);
      return { ...s, badges: b };
    });
  }, [state.decks, state.sessions, state.xp, state.streak]);

  const route = stack[stack.length - 1];
  const navigate = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const goTab = useCallback((t: Tab) => {
    setStack((s) => {
      const target: Route =
        t === "home" ? { name: "home" } :
        t === "decks" ? { name: "decks" } :
        t === "study" ? { name: "study" } :
        t === "progress" ? { name: "progress" } :
        { name: "profile" };
      return [...s, target];
    });
  }, []);

  const ctx: Ctx = { state, setState, route, navigate, back, toast: fire };

  return (
    <div className="min-h-[100dvh] w-full bg-gray-100 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-[520px] min-h-[100dvh] relative bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <AnimatePresence mode="wait">
          <motion.main
            key={routeKey(route)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderRoute(route, ctx)}
          </motion.main>
        </AnimatePresence>
        {route.name !== "onboarding" && (
          <BottomNav tab={tabOf(route)} onTab={goTab} onFab={() => navigate({ name: "create" })} />
        )}
      </div>
      <Toast message={msg} show={show} />
    </div>
  );
}

function routeKey(r: Route): string {
  switch (r.name) {
    case "deck": case "editDeck": case "studyDeck": case "quizDeck": return r.name + ":" + r.deckId;
    case "editCard": case "addCard": return r.name + ":" + r.deckId + ":" + (r as any).cardId;
    default: return r.name;
  }
}

function renderRoute(r: Route, ctx: Ctx) {
  switch (r.name) {
    case "onboarding": return <Onboarding ctx={ctx} />;
    case "home": return <Home ctx={ctx} />;
    case "decks": return <Decks ctx={ctx} />;
    case "deck": return <DeckDetail ctx={ctx} deckId={r.deckId} />;
    case "create": return <CreateOrEditDeck ctx={ctx} />;
    case "editDeck": return <CreateOrEditDeck ctx={ctx} deckId={r.deckId} />;
    case "addCard": return <AddOrEditCard ctx={ctx} deckId={r.deckId} />;
    case "editCard": return <AddOrEditCard ctx={ctx} deckId={r.deckId} cardId={r.cardId} />;
    case "study": return <StudyHub ctx={ctx} />;
    case "studyDeck": return <StudyDeck ctx={ctx} deckId={r.deckId} mode={r.mode} minutes={r.minutes} />;
    case "quizDeck": return <QuizDeck ctx={ctx} deckId={r.deckId} />;
    case "progress": return <Progress ctx={ctx} />;
    case "profile": return <Profile ctx={ctx} />;
    case "settings": return <Settings ctx={ctx} />;
  }
}

function BottomNav({ tab, onTab, onFab }: { tab: Tab; onTab: (t: Tab) => void; onFab: () => void }) {
  const items: { k: Tab; i: string; l: string }[] = [
    { k: "home", i: "🏠", l: "Home" },
    { k: "decks", i: "🗂", l: "Decks" },
    { k: "study", i: "🎴", l: "Study" },
    { k: "progress", i: "📊", l: "Progress" },
    { k: "profile", i: "👤", l: "Profile" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 safe-bottom pointer-events-none">
      <div className="mx-auto max-w-[520px] px-3 pb-3">
        <div className="pointer-events-auto bg-white dark:bg-gray-800 rounded-2xl p-2 flex items-center justify-between shadow-lg border border-gray-200 dark:border-gray-700 relative">
          {items.slice(0, 2).map((it) => <NavItem key={it.k} active={tab === it.k} onClick={() => onTab(it.k)} icon={it.i} label={it.l} />)}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onFab}
            className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 rounded-full bg-primary-600 text-white text-2xl grid place-items-center shadow-lg border-4 border-white dark:border-gray-900"
          >
            ＋
          </motion.button>
          <div className="w-14 shrink-0" />
          {items.slice(3).map((it) => <NavItem key={it.k} active={tab === it.k} onClick={() => onTab(it.k)} icon={it.i} label={it.l} />)}
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-0.5 py-1">
      <span className="text-xl">{icon}</span>
      <span className={active ? "text-xs font-bold text-primary-700 dark:text-primary-300" : "text-xs font-semibold text-gray-700 dark:text-gray-200"}>
        {label}
      </span>
    </button>
  );
}
