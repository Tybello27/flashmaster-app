import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AppState, Deck, Flashcard, Difficulty, uid, today, totalCards, masteredCount,
  levelFromXp, timeOfDayGreeting, formatDuration, daysAgoLabel, QUOTES, ACHIEVEMENTS,
  recomputeBadges, updateStreak, weeklyStudy, subjectDistribution, SUBJECTS, CATEGORIES, DECK_ICONS,
  generateQuiz, gradeFill,
} from "./lib";
import {
  Card, Button, IconButton, Input, Textarea, Select, Chip,
  ProgressRing, EmptyState, InstallButton, PageHeader, cx, Speak, usePwaInstall,
} from "./components";

export type Route =
  | { name: "home" } | { name: "decks" } | { name: "study" } | { name: "progress" } | { name: "profile" }
  | { name: "deck"; deckId: string }
  | { name: "create" } | { name: "editDeck"; deckId: string }
  | { name: "addCard"; deckId: string } | { name: "editCard"; deckId: string; cardId: string }
  | { name: "studyDeck"; deckId: string; mode: "normal" | "shuffle" | "favorites" | "timed"; minutes?: number }
  | { name: "quizDeck"; deckId: string }
  | { name: "settings" } | { name: "onboarding" };

export interface Ctx {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  route: Route;
  navigate: (r: Route) => void;
  back: () => void;
  toast: (m: string) => void;
}

// ---------- Semantic helpers to keep contrast consistent ----------
const H1 = "text-2xl font-extrabold text-gray-900 dark:text-white";
const H2 = "text-lg font-bold text-gray-900 dark:text-white";
const LABEL = "text-sm font-semibold text-gray-900 dark:text-white";
const MUTED = "text-sm text-gray-600 dark:text-gray-300";
const MUTED_XS = "text-xs text-gray-600 dark:text-gray-300";

// Colored badge helper — always dark text on light bg, and inverted for dark mode.
function diffClass(d: Difficulty) {
  switch (d) {
    case "easy":    return "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100";
    case "medium":  return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100";
    case "hard":    return "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100";
    case "learned": return "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100";
  }
}

// ---------------- Onboarding ----------------
export function Onboarding({ ctx }: { ctx: Ctx }) {
  const [step, setStep] = useState(0);
  const slides = [
    { icon: "📚", title: "Welcome to FlashMaster", subtitle: "Learn smarter, not harder." },
    { icon: "🗂️", title: "Create Decks", subtitle: "Organize flashcards by subject and category." },
    { icon: "🎯", title: "Study & Quiz", subtitle: "Master your cards with study and quiz modes." },
    { icon: "📊", title: "Track Progress", subtitle: "See your streaks, XP, and achievements." },
  ];
  return (
    <div className="min-h-[100dvh] flex flex-col bg-white dark:bg-gray-900">
      <div className="flex-1 grid place-items-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-7xl mb-6">{slides[step].icon}</div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{slides[step].title}</h1>
          <p className="text-gray-700 dark:text-gray-200 mt-2">{slides[step].subtitle}</p>
          <div className="mt-8 flex justify-center gap-2">
            {slides.map((_, i) => (
              <div key={i} className={cx("h-2 rounded-full transition-all", i === step ? "w-6 bg-primary-600" : "w-2 bg-gray-300 dark:bg-gray-600")} />
            ))}
          </div>
        </div>
      </div>
      <div className="p-6 safe-bottom space-y-2">
        <Button onClick={() => {
          if (step < slides.length - 1) setStep(step + 1);
          else ctx.setState((s) => ({ ...s, onboardingDone: true }));
        }}>
          {step < slides.length - 1 ? "Next" : "Get Started"}
        </Button>
        {step < slides.length - 1 && (
          <button onClick={() => ctx.setState((s) => ({ ...s, onboardingDone: true }))} className="w-full py-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------- Home ----------------
export function Home({ ctx }: { ctx: Ctx }) {
  const s = ctx.state;
  const g = timeOfDayGreeting(s.userName);
  const lvl = levelFromXp(s.xp);
  const doneToday = s.sessions.filter((x) => x.date === today()).reduce((a, b) => a + b.cardsStudied, 0);
  const goalPct = Math.min(1, doneToday / Math.max(1, s.settings.dailyGoal));
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const recents = [...s.decks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      <InstallButton />

      <div className="flex items-center justify-between">
        <div>
          <h1 className={H1}>{g.text} {g.emoji}</h1>
          <p className={MUTED}>Let's master something new today!</p>
        </div>
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full bg-primary-600 text-white grid place-items-center font-bold text-lg">
            {s.userName.slice(0, 1).toUpperCase()}
          </div>
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">Lv{lvl.level}</span>
        </div>
      </div>

      <Card className="flex items-center gap-5">
        <ProgressRing value={goalPct} size={110} stroke={10} label={`${Math.round(goalPct * 100)}%`} sublabel="Goal" />
        <div className="flex-1">
          <div className={MUTED}>Daily Goal</div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{doneToday}<span className="text-gray-500 dark:text-gray-400 text-lg font-semibold">/{s.settings.dailyGoal}</span></div>
          <div className={MUTED_XS + " mt-1"}>{s.settings.dailyGoal - doneToday > 0 ? `${s.settings.dailyGoal - doneToday} cards to go` : "Goal achieved! 🎉"}</div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className={MUTED}>Streak</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{s.streak} days</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <span className={MUTED}>XP</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{s.xp}</div>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <QuickAction icon="＋" label="New" onClick={() => ctx.navigate({ name: "create" })} />
        <QuickAction icon="🎴" label="Study" onClick={() => ctx.navigate({ name: "study" })} />
        <QuickAction icon="📊" label="Progress" onClick={() => ctx.navigate({ name: "progress" })} />
        <QuickAction icon="👤" label="Profile" onClick={() => ctx.navigate({ name: "profile" })} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className={H2}>Recent Decks</h2>
          <button onClick={() => ctx.navigate({ name: "decks" })} className="text-sm font-semibold text-primary-700 dark:text-primary-300">See all</button>
        </div>
        {recents.length === 0 ? (
          <Card>
            <EmptyState icon="🗂️" title="No decks yet" subtitle="Create your first deck to get started." action={<Button onClick={() => ctx.navigate({ name: "create" })}>Create Deck</Button>} />
          </Card>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {recents.map((d) => (
              <button key={d.id} onClick={() => ctx.navigate({ name: "deck", deckId: d.id })} className="shrink-0 w-40 text-left">
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary-600 text-white grid place-items-center text-lg shrink-0">{d.icon}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{d.name}</div>
                      <div className={MUTED_XS + " truncate"}>{d.subject}</div>
                    </div>
                  </div>
                  <div className={MUTED_XS + " mt-2"}>{d.cards.length} cards</div>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>

      <Card>
        <div className={LABEL + " mb-2"}>💡 Quote of the Day</div>
        <div className="italic text-gray-800 dark:text-gray-100">“{quote.q}”</div>
        <div className="text-right text-sm text-gray-600 dark:text-gray-300 mt-2">— {quote.a}</div>
      </Card>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "p-3 rounded-xl text-center border transition-colors",
        "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
        "dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700"
      )}
    >
      <div className="text-2xl">{icon}</div>
      <div className="text-xs font-semibold mt-1">{label}</div>
    </button>
  );
}

// ---------------- Decks list ----------------
export function Decks({ ctx }: { ctx: Ctx }) {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<string>("All");
  const decks = ctx.state.decks.filter((d) =>
    (subject === "All" || d.subject === subject) &&
    (q === "" || d.name.toLowerCase().includes(q.toLowerCase()) || d.category.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className={H1}>My Decks</h1>
        <IconButton onClick={() => ctx.navigate({ name: "create" })} title="New deck">＋</IconButton>
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search decks or categories..." />
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        <Chip active={subject === "All"} onClick={() => setSubject("All")}>All</Chip>
        {SUBJECTS.map((s) => <Chip key={s} active={subject === s} onClick={() => setSubject(s)}>{s}</Chip>)}
      </div>
      {decks.length === 0 ? (
        <Card>
          <EmptyState icon="🗂️" title="No decks found" subtitle="Try a different search or create a new deck." action={<Button onClick={() => ctx.navigate({ name: "create" })}>Create Deck</Button>} />
        </Card>
      ) : (
        <div className="space-y-3">
          {decks.map((d) => (
            <button key={d.id} onClick={() => ctx.navigate({ name: "deck", deckId: d.id })} className="block w-full text-left">
              <Card className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-primary-600 text-white grid place-items-center text-xl shrink-0">{d.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white truncate">{d.name}</div>
                  <div className={MUTED_XS + " truncate"}>{d.subject} · {d.category}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100">{d.cards.length} cards</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
                      {d.cards.filter((c) => c.difficulty === "learned").length} mastered
                    </span>
                  </div>
                </div>
                <span className="text-gray-500 dark:text-gray-300 text-xl shrink-0">›</span>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Deck Detail ----------------
export function DeckDetail({ ctx, deckId }: { ctx: Ctx; deckId: string }) {
  const deck = ctx.state.decks.find((d) => d.id === deckId);
  if (!deck) return <EmptyState icon="🤔" title="Deck not found" action={<Button onClick={ctx.back}>Go back</Button>} />;
  const mastered = deck.cards.filter((c) => c.difficulty === "learned").length;
  const pct = deck.cards.length ? mastered / deck.cards.length : 0;

  return (
    <div className="pb-28">
      <PageHeader title={deck.name} onBack={ctx.back} right={<IconButton onClick={() => ctx.navigate({ name: "editDeck", deckId: deck.id })} title="Edit">✎</IconButton>} />
      <div className="px-4 pt-4 space-y-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-600 text-white grid place-items-center text-2xl shrink-0">{deck.icon}</div>
            <div className="min-w-0 flex-1">
              <div className={MUTED_XS + " truncate"}>{deck.subject} · {deck.category}</div>
              <div className="text-xl font-extrabold text-gray-900 dark:text-white truncate">{deck.name}</div>
              {deck.description && <div className={MUTED + " mt-0.5 line-clamp-2"}>{deck.description}</div>}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniStat value={deck.cards.length} label="Cards" />
            <MiniStat value={mastered} label="Mastered" />
            <MiniStat value={`${Math.round(pct * 100)}%`} label="Progress" />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => ctx.navigate({ name: "studyDeck", deckId: deck.id, mode: "normal" })}>▶ Study</Button>
          <Button variant="secondary" onClick={() => ctx.navigate({ name: "quizDeck", deckId: deck.id })}>📝 Quiz</Button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          <Chip onClick={() => ctx.navigate({ name: "studyDeck", deckId: deck.id, mode: "shuffle" })}>🔀 Shuffle</Chip>
          <Chip onClick={() => ctx.navigate({ name: "studyDeck", deckId: deck.id, mode: "favorites" })}>★ Favorites</Chip>
          <Chip onClick={() => ctx.navigate({ name: "studyDeck", deckId: deck.id, mode: "timed", minutes: 5 })}>⏱ 5 min</Chip>
        </div>

        <div className="flex items-center justify-between px-1">
          <h2 className={H2}>Cards ({deck.cards.length})</h2>
          <button onClick={() => ctx.navigate({ name: "addCard", deckId: deck.id })} className="text-sm font-semibold text-primary-700 dark:text-primary-300">＋ Add card</button>
        </div>

        {deck.cards.length === 0 ? (
          <Card><EmptyState icon="🃏" title="No cards yet" subtitle="Add your first flashcard." action={<Button onClick={() => ctx.navigate({ name: "addCard", deckId: deck.id })}>Add Card</Button>} /></Card>
        ) : (
          <div className="space-y-2">
            {deck.cards.map((c) => (
              <Card key={c.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                    {c.front}
                    {c.favorite && <span className="text-yellow-500">★</span>}
                  </div>
                  <div className={MUTED_XS + " truncate"}>{c.back}</div>
                </div>
                <span className={cx("text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0", diffClass(c.difficulty))}>{c.difficulty}</span>
                <IconButton onClick={() => ctx.navigate({ name: "editCard", deckId: deck.id, cardId: c.id })} title="Edit">✎</IconButton>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg py-2">
      <div className="text-lg font-extrabold text-gray-900 dark:text-white">{value}</div>
      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-200">{label}</div>
    </div>
  );
}

// ---------------- Create/Edit Deck ----------------
export function CreateOrEditDeck({ ctx, deckId }: { ctx: Ctx; deckId?: string }) {
  const existing = deckId ? ctx.state.decks.find((d) => d.id === deckId) : undefined;
  const [name, setName] = useState(existing?.name || "");
  const [subject, setSubject] = useState<any>(existing?.subject || "Science");
  const [category, setCategory] = useState(existing?.category || CATEGORIES["Science"][0]);
  const [icon, setIcon] = useState(existing?.icon || "⚛️");
  const [description, setDescription] = useState(existing?.description || "");

  useEffect(() => { setCategory(CATEGORIES[subject as keyof typeof CATEGORIES]?.[0] || "General"); }, [subject]);

  const save = () => {
    if (!name.trim()) return ctx.toast("Deck name required");
    ctx.setState((s) => {
      const decks = [...s.decks];
      if (existing) {
        const idx = decks.findIndex((d) => d.id === existing.id);
        decks[idx] = { ...existing, name: name.trim(), subject, category, icon, color: existing.color, description };
      } else {
        decks.unshift({ id: uid(), name: name.trim(), subject, category, icon, color: "indigo", description, cards: [], createdAt: Date.now() });
      }
      const next = { ...s, decks };
      next.badges = recomputeBadges(next);
      return next;
    });
    ctx.toast(existing ? "Deck updated" : "Deck created");
    ctx.back();
  };
  const del = () => {
    if (!existing) return;
    if (!confirm("Delete this deck and all its cards?")) return;
    ctx.setState((s) => ({ ...s, decks: s.decks.filter((d) => d.id !== existing.id) }));
    ctx.toast("Deck deleted");
    ctx.back();
  };
  const dup = () => {
    if (!existing) return;
    ctx.setState((s) => {
      const copy: Deck = { ...existing, id: uid(), name: existing.name + " (Copy)", createdAt: Date.now(), cards: existing.cards.map((c) => ({ ...c, id: uid() })) };
      return { ...s, decks: [copy, ...s.decks] };
    });
    ctx.toast("Deck duplicated");
    ctx.back();
  };

  return (
    <div className="pb-28">
      <PageHeader title={existing ? "Edit Deck" : "Create Deck"} onBack={ctx.back} />
      <div className="px-4 pt-4 space-y-4">
        <Field label="Deck Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Quantum Physics" />
        </Field>
        <Field label="Subject">
          <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {(CATEGORIES[subject as keyof typeof CATEGORIES] || ["General"]).map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Icon">
          <div className="grid grid-cols-6 gap-2">
            {DECK_ICONS.map((i) => (
              <button key={i} onClick={() => setIcon(i)} className={cx(
                "aspect-square rounded-lg text-xl font-bold border transition-colors",
                icon === i
                  ? "bg-primary-600 text-white border-primary-700"
                  : "bg-white text-gray-900 border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
              )}>{i}</button>
            ))}
          </div>
        </Field>
        <Field label="Description (optional)">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this deck about?" />
        </Field>
        <Button onClick={save}>{existing ? "Save Changes" : "Create Deck"}</Button>
        {existing && (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={dup}>Duplicate</Button>
            <Button variant="danger" onClick={del}>Delete</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className={LABEL + " mb-1.5"}>{label}</div>
      {children}
    </label>
  );
}

// ---------------- Add/Edit Card ----------------
export function AddOrEditCard({ ctx, deckId, cardId }: { ctx: Ctx; deckId: string; cardId?: string }) {
  const deck = ctx.state.decks.find((d) => d.id === deckId);
  const card = cardId ? deck?.cards.find((c) => c.id === cardId) : undefined;
  const [front, setFront] = useState(card?.front || "");
  const [back, setBack] = useState(card?.back || "");
  const [tags, setTags] = useState((card?.tags || []).join(", "));
  const [image, setImage] = useState<string | undefined>(card?.image);
  if (!deck) return null;

  const onFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => setImage(r.result as string);
    r.readAsDataURL(f);
  };
  const save = () => {
    if (!front.trim() || !back.trim()) return ctx.toast("Front and back required");
    ctx.setState((s) => {
      const decks = s.decks.map((d) => {
        if (d.id !== deckId) return d;
        const cards = [...d.cards];
        const tagArr = tags.split(",").map((t) => t.trim()).filter(Boolean);
        if (card) {
          const i = cards.findIndex((c) => c.id === card.id);
          cards[i] = { ...card, front, back, tags: tagArr, image };
        } else {
          cards.push({ id: uid(), front, back, tags: tagArr, image, difficulty: "medium", favorite: false, createdAt: Date.now(), reviewCount: 0 });
        }
        return { ...d, cards };
      });
      const next = { ...s, decks };
      next.badges = recomputeBadges(next);
      return next;
    });
    ctx.toast(card ? "Card updated" : "Card added");
    ctx.back();
  };
  const del = () => {
    if (!card) return;
    ctx.setState((s) => ({ ...s, decks: s.decks.map((d) => d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== card.id) } : d) }));
    ctx.toast("Card deleted");
    ctx.back();
  };
  const dup = () => {
    if (!card) return;
    ctx.setState((s) => ({ ...s, decks: s.decks.map((d) => d.id === deckId ? { ...d, cards: [{ ...card, id: uid(), createdAt: Date.now() }, ...d.cards] } : d) }));
    ctx.toast("Card duplicated");
    ctx.back();
  };
  return (
    <div className="pb-28">
      <PageHeader title={card ? "Edit Card" : "Add Card"} onBack={ctx.back} />
      <div className="px-4 pt-4 space-y-4">
        <Field label="Front (Question)"><Textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} placeholder="e.g. What is Planck's constant?" /></Field>
        <Field label="Back (Answer)"><Textarea value={back} onChange={(e) => setBack(e.target.value)} rows={3} placeholder="e.g. 6.626 × 10⁻³⁴ J·s" /></Field>
        <Field label="Tags (comma separated)"><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="physics, constant" /></Field>
        <Field label="Image (optional)">
          <label className="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer bg-white dark:bg-gray-800">
            {image ? <img src={image} alt="" className="max-h-40 mx-auto rounded-lg" /> : <div className="text-gray-700 dark:text-gray-200 font-medium">📷 Tap to upload an image</div>}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
          {image && <button onClick={() => setImage(undefined)} className="text-sm font-semibold text-red-600 dark:text-red-400 mt-2">Remove image</button>}
        </Field>
        <Button onClick={save}>{card ? "Save Changes" : "Add Card"}</Button>
        {card && (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={dup}>Duplicate</Button>
            <Button variant="danger" onClick={del}>Delete</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Study Mode ----------------
export function StudyDeck({ ctx, deckId, mode, minutes }: { ctx: Ctx; deckId: string; mode: "normal" | "shuffle" | "favorites" | "timed"; minutes?: number }) {
  const deck = ctx.state.decks.find((d) => d.id === deckId);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(mode === "timed" ? (minutes || 5) * 60 : null);
  const startRef = useRef(Date.now());

  const cards = useMemo(() => {
    if (!deck) return [];
    let cs = [...deck.cards];
    if (mode === "favorites") cs = cs.filter((c) => c.favorite);
    if (mode === "shuffle") cs = cs.sort(() => Math.random() - 0.5);
    return cs;
  }, [deck, mode]);

  useEffect(() => {
    if (remaining === null) return;
    const t = setInterval(() => setRemaining((r) => (r === null ? r : Math.max(0, r - 1))), 1000);
    return () => clearInterval(t);
  }, [remaining]);
  useEffect(() => { if (remaining === 0) finish(); /* eslint-disable-next-line */ }, [remaining]);

  if (!deck) return null;
  if (cards.length === 0) return (
    <div className="pb-28">
      <PageHeader title="Study Mode" onBack={ctx.back} />
      <div className="px-4 pt-4"><Card><EmptyState icon="🃏" title={mode === "favorites" ? "No favorite cards" : "No cards to study"} action={<Button onClick={ctx.back}>Back</Button>} /></Card></div>
    </div>
  );

  const card = cards[idx];
  const finish = () => {
    const dur = Math.round((Date.now() - startRef.current) / 1000);
    ctx.setState((s) => {
      const studiedIds = new Set(cards.map((c) => c.id));
      const decks = s.decks.map((d) => d.id === deckId ? { ...d, cards: d.cards.map((c) => studiedIds.has(c.id) ? { ...c, lastReviewed: Date.now(), reviewCount: c.reviewCount + 1 } : c) } : d);
      const session = { id: uid(), date: today(), deckId, cardsStudied: cards.length, correct: 0, total: cards.length, xpGained: cards.length * 5, durationSec: dur, mode: "study" as const };
      const next = { ...s, decks, sessions: [...s.sessions, session], xp: s.xp + session.xpGained, totalStudySeconds: s.totalStudySeconds + dur };
      const updated = updateStreak(next);
      updated.badges = recomputeBadges(updated);
      return updated;
    });
    setFinished(true);
  };
  const mark = (d: Difficulty) => {
    ctx.setState((s) => ({ ...s, decks: s.decks.map((x) => x.id === deckId ? { ...x, cards: x.cards.map((c) => c.id === card.id ? { ...c, difficulty: d } : c) } : x) }));
    ctx.toast(d === "learned" ? "Marked as learned ✓" : `Marked as ${d}`);
    next();
  };
  const toggleFav = () => ctx.setState((s) => ({ ...s, decks: s.decks.map((x) => x.id === deckId ? { ...x, cards: x.cards.map((c) => c.id === card.id ? { ...c, favorite: !c.favorite } : c) } : x) }));
  const next = () => { setFlipped(false); if (idx < cards.length - 1) setIdx(idx + 1); else finish(); };
  const prev = () => { setFlipped(false); if (idx > 0) setIdx(idx - 1); };

  if (finished) {
    return (
      <div className="pb-28">
        <PageHeader title="Session Complete" onBack={ctx.back} />
        <div className="px-4 pt-4">
          <Card className="text-center">
            <div className="text-6xl mb-2">🎉</div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Nicely done!</h2>
            <p className="text-gray-700 dark:text-gray-200 mt-1">You reviewed {cards.length} cards and earned {cards.length * 5} XP.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button onClick={() => { setIdx(0); setFinished(false); startRef.current = Date.now(); setRemaining(mode === "timed" ? (minutes || 5) * 60 : null); }}>Study Again</Button>
              <Button variant="secondary" onClick={ctx.back}>Done</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <PageHeader title="Study Mode" onBack={ctx.back} right={<IconButton onClick={toggleFav} title="Favorite">{card.favorite ? "★" : "☆"}</IconButton>} />
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="font-semibold text-gray-900 dark:text-white">{idx + 1} / {cards.length}</div>
          {remaining !== null && <div className="font-bold text-primary-700 dark:text-primary-300">⏱ {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</div>}
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <motion.div className="h-full bg-primary-600" animate={{ width: `${((idx + 1) / cards.length) * 100}%` }} />
        </div>

        <div className="relative" style={{ perspective: 1200 }}>
          <motion.div
            className="w-full rounded-2xl overflow-hidden cursor-pointer"
            style={{ transformStyle: "preserve-3d", height: 340, position: "relative" }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => setFlipped((f) => !f)}
          >
            {/* Front — WHITE bg + BLACK text (light), DARK bg + WHITE text (dark) */}
            <div
              className="absolute inset-0 bg-white text-gray-900 dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col shadow-md"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span className="truncate">{deck.icon} {deck.name}</span>
                <span>Question</span>
              </div>
              <div className="flex-1 grid place-items-center text-center text-2xl font-extrabold px-2">{card.front}</div>
              {card.image && <img src={card.image} alt="" className="max-h-24 mx-auto rounded-lg" />}
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">Tap to reveal answer</div>
            </div>
            {/* Back — solid PRIMARY blue + WHITE text (both themes) for max contrast */}
            <div
              className="absolute inset-0 bg-primary-600 text-white rounded-2xl p-6 flex flex-col shadow-md"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-white/90">
                <span>Answer</span><span>Tap to flip back</span>
              </div>
              <div className="flex-1 grid place-items-center text-center text-xl font-bold px-2 text-white">{card.back}</div>
              <div className="flex justify-center">
                <button
                  onClick={(e) => { e.stopPropagation(); if (ctx.state.settings.tts) Speak(card.back); }}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white text-primary-700 hover:bg-gray-100"
                >
                  🔊 Listen
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <IconButton onClick={prev} title="Previous">←</IconButton>
          <div className="flex gap-2">
            <Chip onClick={() => { if (ctx.state.settings.tts) Speak(card.front); }}>🔊 TTS</Chip>
            <Chip onClick={() => ctx.navigate({ name: "studyDeck", deckId: deck.id, mode: "shuffle" })}>🔀 Shuffle</Chip>
          </div>
          <IconButton onClick={next} title="Next">→</IconButton>
        </div>

        <Card className="mt-4">
          <div className={MUTED + " text-center mb-3"}>Mark as</div>
          <div className="grid grid-cols-4 gap-2">
            {(["easy", "medium", "hard", "learned"] as Difficulty[]).map((d) => (
              <button key={d} onClick={() => mark(d)} className={cx("py-2 rounded-lg font-bold text-sm capitalize border transition-colors border-transparent", diffClass(d))}>{d}</button>
            ))}
          </div>
        </Card>
        <button onClick={toggleFav} className={cx(
          "w-full mt-3 py-3 rounded-lg font-semibold border",
          card.favorite
            ? "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700"
            : "bg-white text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        )}>
          {card.favorite ? "★ Favorited" : "☆ Add to Favorites"}
        </button>
      </div>
    </div>
  );
}

// ---------------- Quiz Mode ----------------
export function QuizDeck({ ctx, deckId }: { ctx: Ctx; deckId: string }) {
  const deck = ctx.state.decks.find((d) => d.id === deckId);
  const questions = useMemo(() => deck ? generateQuiz(deck.cards, Math.min(10, Math.max(4, deck.cards.length))) : [], [deck]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [fill, setFill] = useState("");
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());

  if (!deck || questions.length === 0) return (
    <div className="pb-28">
      <PageHeader title="Quiz Mode" onBack={ctx.back} />
      <div className="px-4 pt-4"><Card><EmptyState icon="📝" title="Not enough cards" subtitle="Add at least 2 cards to generate a quiz." action={<Button onClick={ctx.back}>Back</Button>} /></Card></div>
    </div>
  );
  const q = questions[i];
  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.correctIndex) setCorrect((c) => c + 1);
  };
  const submitFill = () => {
    if (picked !== null) return;
    const ok = gradeFill(fill, q.answer);
    setPicked(ok ? 1 : 0);
    if (ok) setCorrect((c) => c + 1);
  };
  const next = () => {
    if (i < questions.length - 1) { setI(i + 1); setPicked(null); setFill(""); }
    else {
      const dur = Math.round((Date.now() - startRef.current) / 1000);
      const xp = correct * 10 + (correct === questions.length ? 50 : 0);
      ctx.setState((s) => {
        const session = { id: uid(), date: today(), deckId, cardsStudied: questions.length, correct, total: questions.length, xpGained: xp, durationSec: dur, mode: "quiz" as const };
        const n = { ...s, sessions: [...s.sessions, session], xp: s.xp + xp, totalStudySeconds: s.totalStudySeconds + dur };
        const upd = updateStreak(n); upd.badges = recomputeBadges(upd); return upd;
      });
      setDone(true);
    }
  };

  if (done) {
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div className="pb-28">
        <PageHeader title="Quiz Complete" onBack={ctx.back} />
        <div className="px-4 pt-4">
          <Card className="text-center">
            <div className="grid place-items-center"><ProgressRing value={pct / 100} size={140} stroke={12} label={`${pct}%`} sublabel="Score" /></div>
            <div className="mt-4 text-2xl font-extrabold text-gray-900 dark:text-white">{correct} / {questions.length} correct</div>
            <div className={MUTED + " mt-1"}>+{correct * 10 + (correct === questions.length ? 50 : 0)} XP earned</div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button onClick={() => { setI(0); setPicked(null); setCorrect(0); setDone(false); setFill(""); startRef.current = Date.now(); }}>Retry</Button>
              <Button variant="secondary" onClick={ctx.back}>Done</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <PageHeader title="Quiz Mode" onBack={ctx.back} />
      <div className="px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="font-semibold text-gray-900 dark:text-white">Question {i + 1} / {questions.length}</div>
          <div className="font-bold text-primary-700 dark:text-primary-300">Score: {correct}</div>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary-600" animate={{ width: `${((i + 1) / questions.length) * 100}%` }} />
        </div>
        <div className={MUTED_XS + " -mb-2"}>{deck.icon} {deck.name} Quiz</div>
        <Card>
          <div className="inline-block text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100 mb-2">
            {q.type === "mcq" ? "Multiple Choice" : q.type === "tf" ? "True / False" : "Fill in the blank"}
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{q.prompt}</div>
        </Card>
        <div className="space-y-2">
          {q.type === "fill" ? (
            <>
              <Textarea value={fill} onChange={(e) => setFill(e.target.value)} placeholder="Type your answer..." rows={3} />
              {picked !== null && (
                <div className={cx("p-3 rounded-lg text-sm font-semibold",
                  picked ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
                         : "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100")}>
                  {picked ? "✓ Correct!" : <>✗ Expected: <span className="font-bold">{q.answer}</span></>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={submitFill} disabled={picked !== null}>Submit</Button>
                <Button variant="secondary" onClick={next} disabled={picked === null}>Next</Button>
              </div>
            </>
          ) : (
            <>
              {q.options!.map((opt, k) => {
                const isPicked = picked === k;
                const isCorrect = k === q.correctIndex;
                const show = picked !== null;
                return (
                  <button
                    key={k}
                    onClick={() => choose(k)}
                    className={cx(
                      "w-full text-left p-3 rounded-lg border-2 font-medium transition-colors",
                      !show && "bg-white text-gray-900 border-gray-300 hover:border-primary-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:border-primary-400",
                      show && isCorrect && "bg-green-100 border-green-500 text-green-900 dark:bg-green-900 dark:border-green-400 dark:text-green-100",
                      show && isPicked && !isCorrect && "bg-red-100 border-red-500 text-red-900 dark:bg-red-900 dark:border-red-400 dark:text-red-100",
                      show && !isPicked && !isCorrect && "bg-white text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 opacity-70"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{String.fromCharCode(97 + k)}. {opt}</span>
                      {show && isCorrect && <span className="font-bold">✓</span>}
                      {show && isPicked && !isCorrect && <span className="font-bold">✗</span>}
                    </div>
                  </button>
                );
              })}
              <Button onClick={next} disabled={picked === null}>Next</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Study Hub ----------------
export function StudyHub({ ctx }: { ctx: Ctx }) {
  const decks = ctx.state.decks;
  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      <h1 className={H1}>Study</h1>
      <Card>
        <div className={LABEL}>💡 Tip</div>
        <div className={MUTED + " mt-1"}>Shuffle and timed sessions boost retention.</div>
      </Card>
      {decks.length === 0 ? (
        <Card><EmptyState icon="🎴" title="No decks to study" action={<Button onClick={() => ctx.navigate({ name: "create" })}>Create Deck</Button>} /></Card>
      ) : (
        <div className="space-y-3">
          {decks.map((d) => (
            <Card key={d.id}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-primary-600 text-white grid place-items-center text-xl shrink-0">{d.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white truncate">{d.name}</div>
                  <div className={MUTED_XS}>{d.cards.length} cards · {d.subject}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <ModeBtn onClick={() => ctx.navigate({ name: "studyDeck", deckId: d.id, mode: "normal" })}>Study</ModeBtn>
                <ModeBtn onClick={() => ctx.navigate({ name: "studyDeck", deckId: d.id, mode: "shuffle" })}>Shuffle</ModeBtn>
                <ModeBtn onClick={() => ctx.navigate({ name: "studyDeck", deckId: d.id, mode: "timed", minutes: 5 })}>5 min</ModeBtn>
                <ModeBtn onClick={() => ctx.navigate({ name: "quizDeck", deckId: d.id })}>Quiz</ModeBtn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ModeBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="py-2 rounded-lg text-xs font-bold bg-primary-100 text-primary-900 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-100 dark:hover:bg-primary-800 transition-colors"
    >
      {children}
    </button>
  );
}

// ---------------- Progress ----------------
export function Progress({ ctx }: { ctx: Ctx }) {
  const s = ctx.state;
  const week = weeklyStudy(s);
  const maxMin = Math.max(10, ...week.map((w) => w.minutes));
  const dist = subjectDistribution(s);
  const totalDist = Math.max(1, dist.reduce((a, b) => a + b.count, 0));
  const weekCards = s.sessions.filter((x) => { const d = new Date(x.date); const t = new Date(); return (t.getTime() - d.getTime()) / 86400000 <= 7; }).reduce((a, b) => a + b.cardsStudied, 0);
  const weekGoal = s.settings.dailyGoal * 7;
  const weekPct = Math.min(1, weekCards / weekGoal);
  const accuracy = (() => {
    const quizzes = s.sessions.filter((x) => x.mode === "quiz");
    const c = quizzes.reduce((a, b) => a + b.correct, 0);
    const t = quizzes.reduce((a, b) => a + b.total, 0);
    return t ? Math.round((c / t) * 100) : 0;
  })();
  const longestStreak = (() => {
    let cur = 0, max = 0;
    const dates = Array.from(new Set(s.sessions.map((x) => x.date))).sort();
    let prev = "";
    for (const d of dates) {
      const diff = prev ? Math.round((new Date(d).getTime() - new Date(prev).getTime()) / 86400000) : 99;
      cur = diff === 1 ? cur + 1 : 1;
      max = Math.max(max, cur); prev = d;
    }
    return max;
  })();
  const cal: { date: string; count: number }[] = [];
  for (let i = 34; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const count = s.sessions.filter((x) => x.date === date).reduce((a, b) => a + b.cardsStudied, 0);
    cal.push({ date, count });
  }

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      <h1 className={H1}>Progress</h1>

      <Card>
        <div className="flex items-center gap-4">
          <ProgressRing value={weekPct} size={110} stroke={10} label={`${Math.round(weekPct * 100)}%`} sublabel="This week" />
          <div>
            <div className={MUTED}>Weekly Goal</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{weekCards}<span className="text-gray-500 dark:text-gray-400 text-lg font-semibold">/{weekGoal}</span></div>
            <div className={MUTED_XS + " mt-1"}>cards studied</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="🎯" label="Cards Mastered" value={masteredCount(s)} />
        <StatCard icon="📈" label="Quiz Accuracy" value={`${accuracy}%`} />
        <StatCard icon="⏱" label="Study Time" value={formatDuration(s.totalStudySeconds)} />
        <StatCard icon="🔥" label="Longest Streak" value={`${longestStreak}d`} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className={LABEL}>Weekly Study Time</div>
          <div className={MUTED_XS}>minutes</div>
        </div>
        <div className="flex items-end gap-2 h-32">
          {week.map((w) => (
            <div key={w.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (w.minutes / maxMin) * 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="w-full rounded-t bg-primary-600"
                />
              </div>
              <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{w.day}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className={LABEL + " mb-3"}>Card Distribution</div>
        {dist.length === 0 ? (
          <div className={MUTED}>No cards yet.</div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  let offset = 0;
                  return dist.map((d) => {
                    const pct = d.count / totalDist;
                    const el = <circle key={d.subject} cx="18" cy="18" r="15.9" fill="transparent" stroke={d.color} strokeWidth="4" strokeDasharray={`${pct * 100} ${100 - pct * 100}`} strokeDashoffset={-offset * 100} />;
                    offset += pct; return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 grid place-items-center text-sm font-bold text-gray-900 dark:text-white">{totalDist}</div>
            </div>
            <div className="flex-1 space-y-1.5">
              {dist.map((d) => (
                <div key={d.subject} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="flex-1 font-semibold text-gray-900 dark:text-white">{d.subject}</span>
                  <span className="text-gray-700 dark:text-gray-200 font-medium">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className={LABEL + " mb-3"}>Activity (last 5 weeks)</div>
        <div className="grid grid-cols-7 gap-1.5">
          {cal.map((c) => {
            const intensity = c.count === 0 ? 0 : Math.min(4, 1 + Math.floor(c.count / 5));
            const colors = ["bg-gray-200 dark:bg-gray-700", "bg-primary-200 dark:bg-primary-800", "bg-primary-400 dark:bg-primary-600", "bg-primary-600 dark:bg-primary-400", "bg-primary-800 dark:bg-primary-300"];
            return <div key={c.date} title={`${c.date}: ${c.count} cards`} className={cx("aspect-square rounded", colors[intensity])} />;
          })}
        </div>
      </Card>

      <Card>
        <div className={LABEL + " mb-2"}>Recent Activity</div>
        {s.sessions.length === 0 ? (
          <div className={MUTED}>No sessions yet.</div>
        ) : s.sessions.slice(-5).reverse().map((x) => {
          const d = x.deckId ? ctx.state.decks.find((d) => d.id === x.deckId) : undefined;
          return (
            <div key={x.id} className="flex items-center gap-3 py-2.5 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="w-9 h-9 rounded-lg grid place-items-center bg-primary-600 text-white text-sm shrink-0">{x.mode === "quiz" ? "📝" : "🎴"}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{d?.name || "Session"} · <span className="capitalize font-semibold">{x.mode}</span></div>
                <div className={MUTED_XS}>{daysAgoLabel(x.date)} · {x.cardsStudied} cards · +{x.xpGained} XP</div>
              </div>
              {x.mode === "quiz" && <div className="text-sm font-extrabold text-primary-700 dark:text-primary-300">{Math.round((x.correct / Math.max(1, x.total)) * 100)}%</div>}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className={MUTED}>{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{value}</div>
    </Card>
  );
}

// ---------------- Profile ----------------
export function Profile({ ctx }: { ctx: Ctx }) {
  const s = ctx.state;
  const lvl = levelFromXp(s.xp);
  return (
    <div className="pb-28">
      <PageHeader title="Profile" onBack={() => ctx.navigate({ name: "home" })} right={<IconButton onClick={() => ctx.navigate({ name: "settings" })} title="Settings">⚙</IconButton>} />
      <div className="px-4 pt-4 space-y-4">
        <Card className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary-600 text-white grid place-items-center text-3xl font-extrabold">{s.userName.slice(0, 1).toUpperCase()}</div>
          <div className="mt-3 text-xl font-extrabold text-gray-900 dark:text-white">{s.userName}</div>
          <div className={MUTED}>Level {lvl.level} Scholar</div>
          <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-primary-600" style={{ width: `${lvl.progress * 100}%` }} /></div>
          <div className={MUTED_XS + " mt-1"}>{s.xp} XP · {Math.round(lvl.progress * 100)}% to Lv {lvl.level + 1}</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniStat value={s.streak} label="Streak" />
            <MiniStat value={s.decks.length} label="Decks" />
            <MiniStat value={totalCards(s)} label="Cards" />
          </div>
        </Card>

        <Card>
          <div className={LABEL + " mb-3"}>Achievements & Badges</div>
          <div className="grid grid-cols-4 gap-3">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = s.badges.includes(a.id);
              return (
                <div key={a.id} className="text-center">
                  <div className={cx(
                    "w-12 h-12 rounded-xl grid place-items-center text-2xl mx-auto",
                    unlocked ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 grayscale"
                  )}>{a.emoji}</div>
                  <div className={cx("text-[10px] mt-1 font-bold leading-tight", unlocked ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>{a.name}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-1 p-2">
          <RowBtn label="Display Name" value={s.userName} onClick={() => { const n = prompt("Your name?", s.userName); if (n) ctx.setState((st) => ({ ...st, userName: n.trim() || st.userName })); }} />
          <RowBtn label="Replay Tutorial" onClick={() => ctx.navigate({ name: "onboarding" })} />
          <RowBtn label="Settings" onClick={() => ctx.navigate({ name: "settings" })} />
        </Card>
      </div>
    </div>
  );
}

function RowBtn({ label, value, onClick }: { label: string; value?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <span className="flex-1 text-left font-semibold text-gray-900 dark:text-white">{label}</span>
      {value && <span className="text-sm text-gray-700 dark:text-gray-200">{value}</span>}
      <span className="text-gray-500 dark:text-gray-300 text-lg">›</span>
    </button>
  );
}

// ---------------- Settings ----------------
export function Settings({ ctx }: { ctx: Ctx }) {
  const s = ctx.state;
  const set = (patch: Partial<AppState["settings"]>) => ctx.setState((st) => ({ ...st, settings: { ...st.settings, ...patch } }));
  const { canInstall, showIOSHint, isStandalone, promptInstall } = usePwaInstall();
  const reset = () => {
    if (!confirm("Reset all FlashMaster data? This cannot be undone.")) return;
    localStorage.removeItem("flashmaster.data.v1");
    location.reload();
  };
  return (
    <div className="pb-28">
      <PageHeader title="Settings" onBack={ctx.back} />
      <div className="px-4 pt-4 space-y-4">
        {/* PWA install card — always visible, changes state depending on install status */}
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-600 text-white grid place-items-center text-xl font-bold shrink-0">📲</div>
          <div className="flex-1 min-w-0">
            <div className={LABEL}>Install FlashMaster</div>
            <div className={MUTED_XS}>
              {isStandalone
                ? "✓ App is installed"
                : canInstall
                ? "Add to your home screen"
                : showIOSHint
                ? "Tap Share → Add to Home Screen"
                : "Open in Chrome/Edge to install"}
            </div>
          </div>
          {canInstall && (
            <button
              onClick={async () => {
                const r = await promptInstall();
                if (r === "accepted") ctx.toast("App installed!");
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold shrink-0"
            >
              Install
            </button>
          )}
        </Card>

        <Card className="space-y-1 p-2">
          <SwitchRow icon="🌙" label="Dark Mode" desc="Toggle dark theme" value={s.settings.darkMode} onChange={(v) => set({ darkMode: v })} />
          <SwitchRow icon="🔔" label="Notifications" desc="Daily study reminders" value={s.settings.notifications} onChange={(v) => set({ notifications: v })} />
          <SwitchRow icon="🔊" label="Sound Effects" desc="Toggle sound feedback" value={s.settings.sound} onChange={(v) => set({ sound: v })} />
          <SwitchRow icon="🗣" label="Text-to-Speech" desc="Read flashcards aloud" value={s.settings.tts} onChange={(v) => set({ tts: v })} />
        </Card>

        <Card className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className={LABEL}>🎯 Daily Goal</div>
              <div className={MUTED_XS}>Cards to study per day</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => set({ dailyGoal: Math.max(5, s.settings.dailyGoal - 5) })} className="w-9 h-9 rounded-full bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white font-bold">−</button>
              <div className="w-10 text-center font-extrabold text-gray-900 dark:text-white">{s.settings.dailyGoal}</div>
              <button onClick={() => set({ dailyGoal: Math.min(100, s.settings.dailyGoal + 5) })} className="w-9 h-9 rounded-full bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white font-bold">＋</button>
            </div>
          </div>
          <div>
            <div className={LABEL + " mb-1"}>⏰ Reminder Time</div>
            <input type="time" value={s.settings.reminderTime} onChange={(e) => set({ reminderTime: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-white text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 outline-none" />
          </div>
        </Card>

        <Card className="space-y-1 p-2">
          <RowBtn label="Change Name" value={s.userName} onClick={() => { const n = prompt("Your name?", s.userName); if (n) ctx.setState((st) => ({ ...st, userName: n.trim() || st.userName })); }} />
          <RowBtn label="Replay Tutorial" onClick={() => ctx.navigate({ name: "onboarding" })} />
          <RowBtn label="Export Data" onClick={() => { const data = JSON.stringify(ctx.state, null, 2); const blob = new Blob([data], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "flashmaster-backup.json"; a.click(); }} />
          <button onClick={reset} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors">
            <span className="flex-1 text-left font-semibold text-red-700 dark:text-red-300">Reset All Data</span>
            <span className="text-red-500 dark:text-red-300 text-lg">›</span>
          </button>
        </Card>
        <div className={MUTED_XS + " text-center"}>FlashMaster v1.0 · Made with ❤ for learners</div>
      </div>
    </div>
  );
}

function SwitchRow({ icon, label, desc, value, onChange }: { icon: string; label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white">{label}</div>
        {desc && <div className={MUTED_XS}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cx("w-12 h-7 rounded-full p-0.5 transition-colors shrink-0", value ? "bg-primary-600" : "bg-gray-300 dark:bg-gray-600")}
        aria-pressed={value}
      >
        <motion.div animate={{ x: value ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-6 h-6 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}
