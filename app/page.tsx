"use client";

import {
  Check,
  ChevronRight,
  Clock3,
  Gamepad2,
  HeartHandshake,
  MessageCircle,
  Mic,
  Plus,
  RotateCcw,
  Send,
  Settings2,
  ShieldCheck,
  Swords,
  Users,
  X
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

type Language = "en" | "tr";
type Tab = "onboarding" | "discover" | "matches" | "lobbies";
type Decision = "passed" | "liked" | "matched";
type Message = { from: "me" | "them"; text: string };

type UserPreferences = {
  games: string[];
  platforms: string[];
  styles: string[];
  voice: string[];
  hours: string[];
};

type Player = {
  id: number;
  name: string;
  age: number;
  city: string;
  initials: string;
  accent: string;
  games: string[];
  rank: string;
  platform: string;
  vibe: string;
  mic: boolean;
  active: string;
  bio: string;
  likedYou: boolean;
  preferredModes: string[];
  languages: string[];
  voicePreference: string;
  availabilityWindow: string;
  personalityTags: string[];
};

type ScoredPlayer = Player & {
  score: number;
  reasons: string[];
};

type Match = {
  playerId: number;
  messages: Message[];
};

type HandoffLinks = {
  discord: string;
  steam: string;
};

type Lobby = {
  id: number;
  title: string;
  game: string;
  mode: string;
  rank: string;
  language: string;
  mic: boolean;
  owner: string;
  size: number;
  members: string[];
  status: "open" | "ready" | "successful";
  createdAt: number;
  readyStartedAt: number | null;
  expiresInSeconds: number;
  handoffLinks: HandoffLinks;
  activity: string;
  fitScore: number;
  feedback?: string;
};

type DbLobby = {
  id: number;
  mode: string;
  region: string;
  micRequired: boolean;
  maxPlayers: number;
  currentPlayers: number;
  note: string;
  createdAt: string;
  expiresAt: string;
};

type ScoredLobby = Lobby & {
  fitScore: number;
  fitReasons: string[];
};

type PersistedState = {
  language: Language;
  tab: Tab;
  preferences: UserPreferences;
  decisions: Record<number, Decision>;
  matches: Match[];
};

const STORAGE_KEY = "queue.productLoop.v2";
const READY_ROOM_SECONDS = 90;

const copy = {
  en: {
    railTitle: "Queue",
    railText: "Swipe into people who make the next match worth queueing for.",
    activeRooms: "live rooms",
    matchesToday: "matches today",
    onboarding: "Profile",
    discover: "Discover",
    matches: "Matches",
    lobbies: "Lobbies",
    onboardingKicker: "Tune the deck before the night starts.",
    discoverKicker: "Player cards ranked by games, comms and session energy.",
    matchesKicker: "Mutual interest turns into a short game plan.",
    lobbiesKicker: "Rooms built to fill fast and move off-app.",
    games: "Games",
    platforms: "Platforms",
    style: "Play style",
    voice: "Voice",
    hours: "Active hours",
    startMatching: "Start matching",
    reject: "Pass",
    accept: "Like",
    matched: "Match opened. Chat is ready.",
    pending: "Like sent. Waiting on their swipe.",
    passed: "Passed. The deck moved on.",
    sharedGames: "Shared games",
    rank: "Rank",
    platform: "Platform",
    active: "Active",
    vibe: "Vibe",
    mic: "Mic",
    noMore: "No more profiles in this deck.",
    resetDeck: "Reset deck",
    resetDemo: "Reset demo",
    typeMessage: "Send a game plan...",
    lobbyCreate: "Create lobby",
    join: "Join",
    joined: "Joined",
    readyRoom: "Ready room",
    successful: "Successful",
    markSuccessful: "Mark successful",
    closed: "Closed",
    game: "Game",
    mode: "Mode",
    size: "Size",
    language: "Language",
    create: "Create",
    lobbyTitle: "Lobby title",
    emptyMatches: "Like a compatible player to open a chat.",
    emptyLobbies: "No open lobbies yet.",
    matchReasonGame: "shared game",
    matchReasonPlatform: "same platform",
    matchReasonVoice: "voice fit",
    matchReasonStyle: "style fit",
    matchReasonTime: "same hours",
    likedYou: "liked you",
    instantMatch: "Instant match",
    waiting: "Waiting",
    pendingLikes: "Pending likes",
    openChats: "Open chats",
    fit: "fit",
    readyIn: "handoff window",
    expiresSoon: "Room window",
    discord: "Discord",
    steam: "Steam",
    ownerOnly: "Waiting for lobby owner",
    successFeedback: "Good session logged. This room can close cleanly.",
    addMessage: "Send",
    lobbyActivity: "Activity",
    whyThis: "Why this match",
    handoffCopy: "Add each other, pick voice, then drop into the session.",
    saved: "Saved locally"
  },
  tr: {
    railTitle: "Queue",
    railText: "Takımla daha iyi olan oyunlar için doğru insanları bulmanın temiz yolu.",
    activeRooms: "aktif oda",
    matchesToday: "bugünkü eşleşme",
    onboarding: "Profil",
    discover: "Keşfet",
    matches: "Eşleşmeler",
    lobbies: "Lobiler",
    onboardingKicker: "Seçimlerin artık kimin öne çıkacağını değiştiriyor.",
    discoverKicker: "Uyum, gerçek oyun alışkanlıklarına göre hesaplanıyor.",
    matchesKicker: "Karşılıklı ilgi kullanışlı bir sohbete dönüşür.",
    lobbiesKicker: "Bu akşamki sıra için kısa ömürlü odalar.",
    games: "Oyunlar",
    platforms: "Platformlar",
    style: "Oyun tarzı",
    voice: "Ses",
    hours: "Aktif saatler",
    startMatching: "Eşleşmeye başla",
    reject: "Geç",
    accept: "Sıraya al",
    matched: "Eşleşme açıldı. Sohbet hazır.",
    pending: "Beğeni gönderildi. Karşı tarafın kaydırması bekleniyor.",
    passed: "Geçildi. Deste ilerledi.",
    sharedGames: "Ortak oyunlar",
    rank: "Rank",
    platform: "Platform",
    active: "Aktif",
    vibe: "Tarz",
    mic: "Mikrofon",
    noMore: "Bu destede başka profil kalmadı.",
    resetDeck: "Desteyi sıfırla",
    resetDemo: "Demoyu sıfırla",
    typeMessage: "Oyun planı yaz...",
    lobbyCreate: "Lobi oluştur",
    join: "Katıl",
    joined: "Katıldın",
    readyRoom: "Hazır oda",
    successful: "Başarılı",
    markSuccessful: "Başarılı kapat",
    closed: "Kapalı",
    game: "Oyun",
    mode: "Mod",
    size: "Kişi",
    language: "Dil",
    create: "Oluştur",
    lobbyTitle: "Lobi başlığı",
    emptyMatches: "Sohbet açmak için uyumlu bir oyuncuyu sağa kaydır.",
    emptyLobbies: "Henüz açık lobi yok.",
    matchReasonGame: "ortak oyun",
    matchReasonPlatform: "aynı platform",
    matchReasonVoice: "ses uyumu",
    matchReasonStyle: "tarz uyumu",
    matchReasonTime: "aynı saatler",
    likedYou: "seni beğendi",
    instantMatch: "Anında eşleşme",
    waiting: "Beklemede",
    pendingLikes: "Bekleyen beğeniler",
    openChats: "Açık sohbetler",
    fit: "uyum",
    readyIn: "handoff süresi",
    expiresSoon: "Oda süresi",
    discord: "Discord",
    steam: "Steam",
    ownerOnly: "Lobi sahibinin kapatması bekleniyor",
    successFeedback: "İyi oyun kaydedildi. Bu oda temizce kapanabilir.",
    addMessage: "Gönder",
    lobbyActivity: "Aktivite",
    whyThis: "Neden uyuyor",
    handoffCopy: "Birbirinizi ekleyin, sesi seçin ve uygulamadan temizce çıkın.",
    saved: "Yerelde kaydedildi"
  }
};

const choices = {
  games: ["Valorant", "CS2", "League", "Apex", "Helldivers 2", "Dota 2"],
  platforms: ["PC", "Steam", "Riot", "Discord", "PlayStation", "Xbox"],
  styles: ["Competitive", "Casual", "Ranked", "Co-op", "Late night"],
  voice: ["Mic on", "Text first", "Either"],
  hours: ["18:00 - 22:00", "20:00 - 00:00", "22:00 - 02:00"]
};

const defaultPreferences: UserPreferences = {
  games: ["Valorant", "CS2"],
  platforms: ["PC", "Steam", "Discord"],
  styles: ["Competitive", "Ranked", "Late night"],
  voice: ["Mic on"],
  hours: ["20:00 - 00:00"]
};

const players: Player[] = [
  {
    id: 1,
    name: "Mira",
    age: 24,
    city: "Istanbul",
    initials: "MR",
    accent: "#3767b1",
    games: ["Valorant", "Apex", "Overwatch 2"],
    rank: "Ascendant II",
    platform: "PC",
    vibe: "Calm shotcaller",
    mic: true,
    active: "21:00 - 01:00",
    bio: "Ranked seriously, comms short, no round-three tilt.",
    likedYou: true,
    preferredModes: ["Competitive", "Ranked", "Late night"],
    languages: ["TR", "EN"],
    voicePreference: "Mic on",
    availabilityWindow: "20:00 - 00:00",
    personalityTags: ["short comms", "clutch calm", "no blame"]
  },
  {
    id: 2,
    name: "Deniz",
    age: 28,
    city: "Ankara",
    initials: "DZ",
    accent: "#1f8a5b",
    games: ["CS2", "Helldivers 2", "The Finals"],
    rank: "Faceit 7",
    platform: "Steam",
    vibe: "Objective first",
    mic: true,
    active: "20:30 - 00:30",
    bio: "Wants people who can lose one match without making it weird.",
    likedYou: false,
    preferredModes: ["Competitive", "Co-op", "Ranked"],
    languages: ["TR", "EN"],
    voicePreference: "Mic on",
    availabilityWindow: "20:00 - 00:00",
    personalityTags: ["objective first", "utility calls", "stable stack"]
  },
  {
    id: 3,
    name: "Selin",
    age: 22,
    city: "Izmir",
    initials: "SN",
    accent: "#bc7b23",
    games: ["League", "Teamfight Tactics", "Minecraft"],
    rank: "Emerald IV",
    platform: "Riot",
    vibe: "Chill competitive",
    mic: false,
    active: "18:00 - 23:00",
    bio: "Ranked on weeknights, cozy servers when the lobby slows down.",
    likedYou: true,
    preferredModes: ["Casual", "Ranked", "Co-op"],
    languages: ["TR"],
    voicePreference: "Text first",
    availabilityWindow: "18:00 - 22:00",
    personalityTags: ["patient", "macro focused", "low pressure"]
  },
  {
    id: 4,
    name: "Aras",
    age: 26,
    city: "Bursa",
    initials: "AR",
    accent: "#ba4f45",
    games: ["Dota 2", "CS2", "Rainbow Six"],
    rank: "Ancient I",
    platform: "PC",
    vibe: "Tactical and patient",
    mic: true,
    active: "22:00 - 02:00",
    bio: "Stable groups, clean calls, and no blame spirals.",
    likedYou: false,
    preferredModes: ["Competitive", "Late night"],
    languages: ["TR"],
    voicePreference: "Mic on",
    availabilityWindow: "22:00 - 02:00",
    personalityTags: ["tactical", "slow rounds", "late queue"]
  },
  {
    id: 5,
    name: "Noah",
    age: 25,
    city: "Berlin",
    initials: "NH",
    accent: "#6b5f4a",
    games: ["Apex", "Valorant", "CS2"],
    rank: "Diamond",
    platform: "Discord",
    vibe: "Fast reset",
    mic: true,
    active: "20:00 - 00:00",
    bio: "Likes quick rematches, clear roles, and one clean warm-up.",
    likedYou: false,
    preferredModes: ["Competitive", "Ranked"],
    languages: ["EN"],
    voicePreference: "Mic on",
    availabilityWindow: "20:00 - 00:00",
    personalityTags: ["fast reset", "entry flex", "warm-up first"]
  }
];

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const t = copy[language];
  const [tab, setTab] = useState<Tab>("onboarding");
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const [matches, setMatches] = useState<Match[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [notice, setNotice] = useState("");
  const [draftLobby, setDraftLobby] = useState({
    title: "Tonight ranked stack",
    game: "CS2",
    mode: "Premier",
    rank: "Gold Nova - MG",
    size: 5,
    language: "TR/EN"
  });
  const [messageDrafts, setMessageDrafts] = useState<Record<number, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  async function loadLobbies() {
    const response = await fetch("/api/lobbies");
    const records = (await response.json()) as DbLobby[];
    setLobbies(records.map(mapDbLobby));
  }

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage hydration syncs client-only state after mount. */
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PersistedState>;
        setLanguage(parsed.language ?? "en");
        setTab(parsed.tab ?? "onboarding");
        setPreferences(parsed.preferences ?? defaultPreferences);
        setDecisions(parsed.decisions ?? {});
        setMatches(parsed.matches ?? []);
      }
    } catch {
      setPreferences(defaultPreferences);
    }

    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect -- API hydration fills client lobby state after mount. */
  useEffect(() => {
    if (!hydrated) return;

    void loadLobbies();
  }, [hydrated]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const payload: PersistedState = {
      language,
      tab,
      preferences,
      decisions,
      matches
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [decisions, hydrated, language, matches, preferences, tab]);

  const scoredPlayers = useMemo(
    () =>
      players
        .map((player) => scorePlayer(player, preferences, t))
        .sort((a, b) => b.score - a.score),
    [preferences, t]
  );

  const currentDeck = scoredPlayers.filter((player) => !decisions[player.id]);
  const currentPlayer = currentDeck[0];

  const matchedPlayers = matches
    .map((match) => {
      const player = players.find((candidate) => candidate.id === match.playerId);
      return player ? { ...scorePlayer(player, preferences, t), messages: match.messages } : null;
    })
    .filter((match): match is ScoredPlayer & { messages: Message[] } => Boolean(match));

  const pendingPlayers = scoredPlayers.filter((player) => decisions[player.id] === "liked");

  const scoredLobbies = useMemo(
    () =>
      lobbies
        .map((lobby) => scoreLobby(lobby, preferences, t))
        .sort((a, b) => {
          const statusWeight = { ready: 3, open: 2, successful: 1 };
          return statusWeight[b.status] - statusWeight[a.status] || b.fitScore - a.fitScore;
        }),
    [lobbies, preferences, t]
  );

  const liveLobbyCount = lobbies.filter((lobby) => lobby.status !== "successful").length;

  const screenMeta = useMemo(() => {
    const titleByTab = {
      onboarding: t.onboarding,
      discover: t.discover,
      matches: t.matches,
      lobbies: t.lobbies
    };
    const kickerByTab = {
      onboarding: t.onboardingKicker,
      discover: t.discoverKicker,
      matches: t.matchesKicker,
      lobbies: t.lobbiesKicker
    };
    return { title: titleByTab[tab], kicker: kickerByTab[tab] };
  }, [t, tab]);

  function updateTab(nextTab: Tab) {
    setTab(nextTab);
  }

  function toggleChoice(group: keyof UserPreferences, value: string) {
    setPreferences((current) => {
      const isSelected = current[group].includes(value);
      const nextValues = isSelected
        ? current[group].filter((item) => item !== value)
        : [...current[group], value];

      return {
        ...current,
        [group]: nextValues.length > 0 ? nextValues : current[group]
      };
    });
  }

  function swipe(accepted: boolean) {
    if (!currentPlayer) return;

    if (!accepted) {
      setDecisions((current) => ({ ...current, [currentPlayer.id]: "passed" }));
      setNotice(t.passed);
      return;
    }

    if (currentPlayer.likedYou) {
      setDecisions((current) => ({ ...current, [currentPlayer.id]: "matched" }));
      setMatches((current) =>
        current.some((match) => match.playerId === currentPlayer.id)
          ? current
          : [
              ...current,
              {
                playerId: currentPlayer.id,
                messages: [
                  {
                    from: "them",
                    text: "I am queueing later tonight. Want to lock a game first?"
                  },
                  {
                    from: "me",
                    text: "Works for me. Let's pick the least chaotic option."
                  }
                ]
              }
            ]
      );
      setNotice(t.matched);
      return;
    }

    setDecisions((current) => ({ ...current, [currentPlayer.id]: "liked" }));
    setNotice(t.pending);
  }

  function resetDeck() {
    setDecisions({});
    setMatches([]);
    setMessageDrafts({});
    setNotice("");
  }

  function resetDemo() {
    const timestamp = now ?? 1;
    setLanguage("en");
    setTab("onboarding");
    setPreferences(defaultPreferences);
    setDecisions({});
    setMatches([]);
    setMessageDrafts({});
    void loadLobbies();
    setNotice("");
    setNow(timestamp);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  async function createLobby() {
    const response = await fetch("/api/lobbies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: `${draftLobby.game} ${draftLobby.mode}`.trim(),
        region: draftLobby.language,
        micRequired: preferences.voice.includes("Mic on"),
        maxPlayers: Number(draftLobby.size),
        note: draftLobby.title.trim() || "Tonight ranked stack"
      })
    });

    const record = (await response.json()) as DbLobby;
    setLobbies((current) => [mapDbLobby(record), ...current]);
  }

  async function joinLobby(id: number) {
    const response = await fetch("/api/lobbies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "join" })
    });

    const record = (await response.json()) as DbLobby;
    setLobbies((current) =>
      current.map((lobby) => {
        if (lobby.id !== id) return lobby;

        const nextLobby = mapDbLobby(record);
        return {
          ...nextLobby,
          members: nextLobby.members.includes("You") ? nextLobby.members : [...nextLobby.members, "You"]
        };
      })
    );
  }

  function markSuccessful(id: number) {
    setLobbies((current) =>
      current.map((lobby) =>
        lobby.id === id
          ? {
              ...lobby,
              status: "successful",
              feedback: t.successFeedback
            }
          : lobby
      )
    );
  }

  function sendMessage(playerId: number, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = messageDrafts[playerId]?.trim();
    if (!draft) return;

    setMatches((current) =>
      current.map((match) =>
        match.playerId === playerId
          ? { ...match, messages: [...match.messages, { from: "me", text: draft }] }
          : match
      )
    );
    setMessageDrafts((current) => ({ ...current, [playerId]: "" }));
  }

  return (
    <main className="app-frame" data-theme="ranked-social">
      <aside className="brand-rail" aria-label="Product">
        <div>
          <span className="brand-mark">Q</span>
          <h1>{t.railTitle}</h1>
          <p>{t.railText}</p>
        </div>
        <div className="rail-stats">
          <div className="stat">
            <strong>{liveLobbyCount}</strong>
            <span>{t.activeRooms}</span>
          </div>
          <div className="stat">
            <strong>{matchedPlayers.length}</strong>
            <span>{t.matchesToday}</span>
          </div>
        </div>
      </aside>

      <section className="product-shell">
        <header className="topbar">
          <div>
            <h2 className="screen-title">{screenMeta.title}</h2>
            <p className="screen-kicker">{screenMeta.kicker}</p>
          </div>
          <div className="top-actions">
            <span className="save-state">
              <ShieldCheck size={14} />
              {t.saved}
            </span>
            <button className="reset-button" onClick={resetDemo} type="button">
              <RotateCcw size={15} />
              {t.resetDemo}
            </button>
            <div className="lang-toggle" aria-label="Language">
              <button
                className={language === "en" ? "active" : ""}
                onClick={() => setLanguage("en")}
                type="button"
              >
                EN
              </button>
              <button
                className={language === "tr" ? "active" : ""}
                onClick={() => setLanguage("tr")}
                type="button"
              >
                TR
              </button>
            </div>
          </div>
        </header>

        <div className="main-view">
          {tab === "onboarding" && (
            <section className="onboarding motion-in">
              <div className="panel">
                <h2>Build tonight&apos;s player deck.</h2>
                <p>
                  Your stack, voice style and active hours shape who appears first.
                  Keep it sharp now, swipe faster later.
                </p>
              </div>
              <ChoiceBlock
                title={t.games}
                options={choices.games}
                selected={preferences.games}
                onToggle={(value) => toggleChoice("games", value)}
              />
              <ChoiceBlock
                title={t.platforms}
                options={choices.platforms}
                selected={preferences.platforms}
                onToggle={(value) => toggleChoice("platforms", value)}
              />
              <ChoiceBlock
                title={t.style}
                options={choices.styles}
                selected={preferences.styles}
                onToggle={(value) => toggleChoice("styles", value)}
              />
              <ChoiceBlock
                title={t.voice}
                options={choices.voice}
                selected={preferences.voice}
                onToggle={(value) => toggleChoice("voice", value)}
              />
              <ChoiceBlock
                title={t.hours}
                options={choices.hours}
                selected={preferences.hours}
                onToggle={(value) => toggleChoice("hours", value)}
              />
              <button className="primary-button" onClick={() => updateTab("discover")} type="button">
                {t.startMatching}
                <ChevronRight size={18} />
              </button>
            </section>
          )}

          {tab === "discover" && (
            <section className="step-grid motion-in">
              {notice && <div className="match-banner">{notice}</div>}
              {currentPlayer ? (
                <>
                  <PlayerCard player={currentPlayer} t={t} />
                  <div className="actions">
                    <button
                      className="round-action reject"
                      onClick={() => swipe(false)}
                      title={t.reject}
                      type="button"
                    >
                      <X size={25} />
                    </button>
                    <button className="secondary-button" onClick={() => swipe(false)} type="button">
                      {t.reject}
                    </button>
                    <button
                      className="round-action accept"
                      onClick={() => swipe(true)}
                      title={t.accept}
                      type="button"
                    >
                      <Check size={25} />
                    </button>
                  </div>
                  <button className="primary-button" onClick={() => swipe(true)} type="button">
                    <HeartHandshake size={18} />
                    {currentPlayer.likedYou ? t.instantMatch : t.accept}
                  </button>
                </>
              ) : (
                <div className="empty-state">
                  <p>{t.noMore}</p>
                  <button className="secondary-button" onClick={resetDeck} type="button">
                    <RotateCcw size={16} />
                    {t.resetDeck}
                  </button>
                </div>
              )}
            </section>
          )}

          {tab === "matches" && (
            <section className="match-list motion-in">
              {matchedPlayers.length === 0 && pendingPlayers.length === 0 ? (
                <div className="empty-state">{t.emptyMatches}</div>
              ) : (
                <>
                  {matchedPlayers.length > 0 && <h3 className="section-label">{t.openChats}</h3>}
                  {matchedPlayers.map((match) => (
                    <article className="match-item" key={match.id}>
                      <div className="item-row">
                        <div>
                          <h3>{match.name}</h3>
                          <p>{match.games.slice(0, 2).join(" / ")} / {match.active}</p>
                        </div>
                        <span className="status-pill">{match.score}%</span>
                      </div>
                      <div className="chat-box">
                        <div className="messages">
                          {match.messages.map((message, index) => (
                            <div className={`bubble ${message.from === "me" ? "me" : ""}`} key={index}>
                              {message.text}
                            </div>
                          ))}
                        </div>
                        <form className="composer" onSubmit={(event) => sendMessage(match.id, event)}>
                          <input
                            aria-label={t.typeMessage}
                            placeholder={t.typeMessage}
                            value={messageDrafts[match.id] ?? ""}
                            onChange={(event) =>
                              setMessageDrafts((current) => ({
                                ...current,
                                [match.id]: event.target.value
                              }))
                            }
                          />
                          <button type="submit" title={t.addMessage}>
                            <Send size={18} />
                          </button>
                        </form>
                      </div>
                    </article>
                  ))}

                  {pendingPlayers.length > 0 && <h3 className="section-label">{t.pendingLikes}</h3>}
                  {pendingPlayers.map((player) => (
                    <article className="match-item pending-match" key={player.id}>
                      <div className="item-row">
                        <div>
                          <h3>{player.name}</h3>
                          <p>{player.games.slice(0, 2).join(" / ")} / {player.active}</p>
                        </div>
                        <span className="status-pill">{t.waiting}</span>
                      </div>
                      <div className="signal-list compact">
                        {player.reasons.map((reason) => (
                          <span className="signal" key={reason}>
                            {reason}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </>
              )}
            </section>
          )}

          {tab === "lobbies" && (
            <section className="step-grid motion-in">
              <div className="panel">
                <h3>{t.lobbyCreate}</h3>
                <div className="form-grid">
                  <label className="field">
                    <span>{t.lobbyTitle}</span>
                    <input
                      value={draftLobby.title}
                      onChange={(event) =>
                        setDraftLobby((current) => ({ ...current, title: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>{t.game}</span>
                    <select
                      value={draftLobby.game}
                      onChange={(event) =>
                        setDraftLobby((current) => ({ ...current, game: event.target.value }))
                      }
                    >
                      {choices.games.map((game) => (
                        <option key={game}>{game}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>{t.mode}</span>
                    <input
                      value={draftLobby.mode}
                      onChange={(event) =>
                        setDraftLobby((current) => ({ ...current, mode: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>{t.rank}</span>
                    <input
                      value={draftLobby.rank}
                      onChange={(event) =>
                        setDraftLobby((current) => ({ ...current, rank: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>{t.size}</span>
                    <select
                      value={draftLobby.size}
                      onChange={(event) =>
                        setDraftLobby((current) => ({
                          ...current,
                          size: Number(event.target.value)
                        }))
                      }
                    >
                      {[2, 3, 4, 5].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>{t.language}</span>
                    <select
                      value={draftLobby.language}
                      onChange={(event) =>
                        setDraftLobby((current) => ({
                          ...current,
                          language: event.target.value
                        }))
                      }
                    >
                      <option>TR/EN</option>
                      <option>EN</option>
                      <option>TR</option>
                    </select>
                  </label>
                </div>
                <button className="primary-button" onClick={createLobby} type="button">
                  <Plus size={18} />
                  {t.create}
                </button>
              </div>

              <div className="lobby-list">
                {scoredLobbies.length === 0 ? (
                  <div className="empty-state">{t.emptyLobbies}</div>
                ) : (
                  scoredLobbies.map((lobby) => (
                    <LobbyCard
                      key={lobby.id}
                      lobby={lobby}
                      t={t}
                      now={now}
                      hydrated={hydrated}
                      onJoin={() => joinLobby(lobby.id)}
                      onSuccess={() => markSuccessful(lobby.id)}
                    />
                  ))
                )}
              </div>
            </section>
          )}
        </div>

        <nav className="bottom-nav" aria-label="Main navigation">
          <NavButton
            active={tab === "onboarding"}
            icon={<Settings2 size={19} />}
            label={t.onboarding}
            onClick={() => updateTab("onboarding")}
          />
          <NavButton
            active={tab === "discover"}
            icon={<Gamepad2 size={19} />}
            label={t.discover}
            onClick={() => updateTab("discover")}
          />
          <NavButton
            active={tab === "matches"}
            icon={<MessageCircle size={19} />}
            label={t.matches}
            onClick={() => updateTab("matches")}
          />
          <NavButton
            active={tab === "lobbies"}
            icon={<Users size={19} />}
            label={t.lobbies}
            onClick={() => updateTab("lobbies")}
          />
        </nav>
      </section>
    </main>
  );
}

function scorePlayer(player: Player, preferences: UserPreferences, t: typeof copy.en): ScoredPlayer {
  let score = 0;
  const reasons: string[] = [];

  if (hasOverlap(player.games, preferences.games)) {
    score += 35;
    reasons.push(t.matchReasonGame);
  }

  if (preferences.platforms.includes(player.platform) || preferences.platforms.includes("Discord")) {
    score += 20;
    reasons.push(t.matchReasonPlatform);
  }

  if (
    preferences.voice.includes("Either") ||
    preferences.voice.includes(player.voicePreference) ||
    (preferences.voice.includes("Mic on") && player.mic)
  ) {
    score += 15;
    reasons.push(t.matchReasonVoice);
  }

  if (hasOverlap(player.preferredModes, preferences.styles)) {
    score += 20;
    reasons.push(t.matchReasonStyle);
  }

  if (preferences.hours.includes(player.availabilityWindow)) {
    score += 10;
    reasons.push(t.matchReasonTime);
  }

  return {
    ...player,
    score: Math.min(100, score),
    reasons: reasons.length > 0 ? reasons : [player.vibe]
  };
}

function scoreLobby(lobby: Lobby, preferences: UserPreferences, t: typeof copy.en): ScoredLobby {
  let fitScore = 0;
  const fitReasons: string[] = [];

  if (preferences.games.includes(lobby.game)) {
    fitScore += 55;
    fitReasons.push(t.matchReasonGame);
  }

  if (lobby.language === "TR/EN" || lobby.language === "EN") {
    fitScore += 15;
    fitReasons.push(t.language);
  }

  if (!lobby.mic || preferences.voice.includes("Mic on") || preferences.voice.includes("Either")) {
    fitScore += 15;
    fitReasons.push(t.matchReasonVoice);
  }

  if (preferences.styles.some((style) => lobby.mode.toLowerCase().includes(style.toLowerCase()))) {
    fitScore += 15;
    fitReasons.push(t.matchReasonStyle);
  }

  return {
    ...lobby,
    fitScore: Math.min(100, Math.max(fitScore, lobby.fitScore)),
    fitReasons: fitReasons.length > 0 ? fitReasons : [lobby.activity]
  };
}

function hasOverlap(left: string[], right: string[]) {
  return left.some((item) => right.includes(item));
}

function mapDbLobby(record: DbLobby): Lobby {
  const createdAt = new Date(record.createdAt).getTime();
  const expiresAt = new Date(record.expiresAt).getTime();
  const status = record.currentPlayers >= record.maxPlayers ? "ready" : "open";
  const game = inferGame(record.mode);
  const members = Array.from({ length: record.currentPlayers }, (_, index) =>
    index === 0 ? "Host" : `Player ${index + 1}`
  );

  return {
    id: record.id,
    title: record.note,
    game,
    mode: record.mode,
    rank: record.region,
    language: record.region,
    mic: record.micRequired,
    owner: "Host",
    size: record.maxPlayers,
    members,
    status,
    createdAt,
    readyStartedAt: status === "ready" ? Date.now() : null,
    expiresInSeconds: Math.max(READY_ROOM_SECONDS, Math.round((expiresAt - Date.now()) / 1000)),
    handoffLinks: {
      discord: `discord.gg/lobby-${record.id}`,
      steam: `steam lobby #${record.id}`
    },
    activity:
      status === "ready"
        ? "Squad is ready to move off-app"
        : `Needs ${record.maxPlayers - record.currentPlayers} more player${
            record.maxPlayers - record.currentPlayers === 1 ? "" : "s"
          }`,
    fitScore: 0
  };
}

function inferGame(mode: string) {
  const normalized = mode.toLowerCase();
  if (normalized.includes("valorant")) return "Valorant";
  if (normalized.includes("cs")) return "CS2";
  if (normalized.includes("helldivers")) return "Helldivers 2";
  if (normalized.includes("league")) return "League";
  if (normalized.includes("apex")) return "Apex";
  if (normalized.includes("dota")) return "Dota 2";
  return mode.split(" ")[0] || "Lobby";
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString();
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getRemainingSeconds(lobby: Lobby, now: number | null, hydrated: boolean) {
  if (!hydrated || now === null || !lobby.readyStartedAt || lobby.status !== "ready") {
    return lobby.expiresInSeconds;
  }

  const elapsed = Math.floor((now - lobby.readyStartedAt) / 1000);
  return Math.max(0, lobby.expiresInSeconds - elapsed);
}

function ChoiceBlock({
  title,
  options,
  selected,
  onToggle
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      <div className="option-grid">
        {options.map((option) => (
          <button
            className={`chip ${selected.includes(option) ? "selected" : ""}`}
            key={option}
            onClick={() => onToggle(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

function PlayerCard({ player, t }: { player: ScoredPlayer; t: typeof copy.en }) {
  return (
    <article className="profile-card">
      <div className="card-sheen" />
      <div className="identity-row">
        <div className="identity">
          <div className="avatar" style={{ background: player.accent }}>
            {player.initials}
          </div>
          <h2>
            {player.name}, {player.age}
          </h2>
          <p>{player.city} / {player.languages.join(", ")}</p>
        </div>
        <div className="score-stack">
          {player.likedYou && <span className="liked-you">{t.likedYou}</span>}
          <span className="compat">{player.score}% match</span>
        </div>
      </div>

      <div className="persona-strip">
        <span>{player.vibe}</span>
        <span>{player.rank}</span>
        <span>{player.active}</span>
      </div>

      <div className="tag-row">
        {player.games.map((game) => (
          <span className="tag" key={game}>
            {game}
          </span>
        ))}
      </div>

      <p className="profile-bio">{player.bio}</p>

      <div>
        <span className="mini-copy">{t.whyThis}</span>
        <div className="signal-list">
          {player.reasons.map((reason) => (
            <span className="signal" key={reason}>
              <Check size={13} />
              {reason}
            </span>
          ))}
        </div>
      </div>

      <div className="detail-grid card-details">
        <Detail label={t.rank} value={player.rank} />
        <Detail label={t.platform} value={player.platform} />
        <Detail label={t.active} value={player.active} />
        <Detail label={t.vibe} value={player.vibe} />
        <Detail label={t.mic} value={player.mic ? "Yes" : "Text first"} />
        <Detail label={t.sharedGames} value={player.games.slice(0, 2).join(", ")} />
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LobbyCard({
  lobby,
  t,
  now,
  hydrated,
  onJoin,
  onSuccess
}: {
  lobby: ScoredLobby;
  t: typeof copy.en;
  now: number | null;
  hydrated: boolean;
  onJoin: () => void;
  onSuccess: () => void;
}) {
  const joined = lobby.members.includes("You");
  const progress = Math.round((lobby.members.length / lobby.size) * 100);
  const remaining = getRemainingSeconds(lobby, now, hydrated);
  const label =
    lobby.status === "successful"
      ? t.closed
      : lobby.status === "ready"
        ? t.readyRoom
        : `${lobby.members.length}/${lobby.size}`;
  const canClose = lobby.owner === "You" && lobby.status === "ready";

  return (
    <article className={`lobby-item ${lobby.status}`}>
      <div className="item-row">
        <div>
          <h3>{lobby.title}</h3>
          <p>
            {lobby.game} / {lobby.mode} / {lobby.rank}
          </p>
        </div>
        <span className="status-pill">{label}</span>
      </div>
      <div className="tag-row">
        <span className="tag">
          <Swords size={13} /> {lobby.game}
        </span>
        <span className="tag">
          <Mic size={13} /> {lobby.mic ? "Mic" : "Text"}
        </span>
        <span className="tag">{lobby.language}</span>
        <span className="tag">{lobby.fitScore}% {t.fit}</span>
      </div>
      <div className="progress" aria-label="Lobby progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="lobby-foot">
        <p>{lobby.members.join(", ")}</p>
        <span>{lobby.activity}</span>
      </div>
      <div className="signal-list compact">
        {lobby.fitReasons.map((reason) => (
          <span className="signal" key={reason}>
            {reason}
          </span>
        ))}
      </div>

      {(lobby.status === "ready" || lobby.status === "successful") && (
        <div className="ready-room">
          <div className="ready-head">
            <div>
              <strong>{t.readyRoom}</strong>
              <p>{t.handoffCopy}</p>
            </div>
            <span className="timer">
              <Clock3 size={15} />
              {lobby.status === "ready" ? formatSeconds(remaining) : t.successful}
            </span>
          </div>
          <div className="handoff-grid">
            <div className="handoff">
              <span>{t.discord}</span>
              <strong>{lobby.handoffLinks.discord}</strong>
            </div>
            <div className="handoff">
              <span>{t.steam}</span>
              <strong>{lobby.handoffLinks.steam}</strong>
            </div>
          </div>
          {lobby.feedback && <div className="feedback-strip">{lobby.feedback}</div>}
        </div>
      )}

      {lobby.status === "successful" ? (
        <button className="secondary-button" disabled type="button">
          {t.successful}
        </button>
      ) : canClose ? (
        <button className="primary-button" onClick={onSuccess} type="button">
          {t.markSuccessful}
        </button>
      ) : lobby.status === "ready" ? (
        <button className="secondary-button" disabled type="button">
          {t.ownerOnly}
        </button>
      ) : (
        <button
          className={joined ? "secondary-button" : "primary-button"}
          disabled={joined}
          onClick={onJoin}
          type="button"
        >
          {joined ? t.joined : t.join}
        </button>
      )}
    </article>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick} type="button">
      {icon}
      <span>{label}</span>
    </button>
  );
}
