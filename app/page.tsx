"use client";

import {
  Check,
  ChevronRight,
  Gamepad2,
  HeartHandshake,
  MessageCircle,
  Mic,
  Plus,
  Send,
  Settings2,
  Swords,
  Users,
  X
} from "lucide-react";
import { useMemo, useState } from "react";

type Language = "en" | "tr";
type Tab = "onboarding" | "discover" | "matches" | "lobbies";

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
  compatibility: number;
};

type Match = Player & {
  messages: { from: "me" | "them"; text: string }[];
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
};

const copy = {
  en: {
    railTitle: "Queue",
    railText: "A clean way to find people for the games that get better with a squad.",
    activeRooms: "live rooms",
    matchesToday: "matches today",
    onboarding: "Profile",
    discover: "Discover",
    matches: "Matches",
    lobbies: "Lobbies",
    onboardingKicker: "Tune the signal before the app starts matching.",
    discoverKicker: "Swipe for teammates, not awkward small talk.",
    matchesKicker: "Mutual interest becomes a useful chat.",
    lobbiesKicker: "Short-lived rooms for tonight's queue.",
    games: "Games",
    platforms: "Platforms",
    style: "Play style",
    voice: "Voice",
    hours: "Active hours",
    startMatching: "Start matching",
    reject: "Pass",
    accept: "Queue up",
    matchMade: "Match opened. Chat is ready.",
    sharedGames: "Shared games",
    rank: "Rank",
    platform: "Platform",
    active: "Active",
    vibe: "Vibe",
    mic: "Mic",
    noMore: "No more profiles in this demo.",
    resetDeck: "Reset deck",
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
    emptyMatches: "Swipe right on a compatible player to open a chat.",
    emptyLobbies: "No open lobbies yet."
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
    onboardingKicker: "Eşleşme başlamadan önce sinyali ayarla.",
    discoverKicker: "Garip sohbet için değil, takım arkadaşı için kaydır.",
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
    matchMade: "Eşleşme açıldı. Sohbet hazır.",
    sharedGames: "Ortak oyunlar",
    rank: "Rank",
    platform: "Platform",
    active: "Aktif",
    vibe: "Tarz",
    mic: "Mikrofon",
    noMore: "Bu demoda başka profil kalmadı.",
    resetDeck: "Desteyi sıfırla",
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
    emptyLobbies: "Henüz açık lobi yok."
  }
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
    bio: "Plays ranked seriously, keeps comms short, never tilts in round three.",
    compatibility: 94
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
    bio: "Looking for people who can lose one match without making it weird.",
    compatibility: 89
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
    bio: "Queue partner for ranked nights, cozy servers on slow weekends.",
    compatibility: 82
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
    bio: "Prefers stable groups, clean calls, and no blame spirals.",
    compatibility: 77
  }
];

const initialLobbies: Lobby[] = [
  {
    id: 101,
    title: "Clean CS2 five-stack",
    game: "CS2",
    mode: "Premier",
    rank: "Gold Nova - MG",
    language: "TR/EN",
    mic: true,
    owner: "Deniz",
    size: 5,
    members: ["Deniz", "Mira", "Ece"],
    status: "open"
  },
  {
    id: 102,
    title: "Valorant late queue",
    game: "Valorant",
    mode: "Ranked",
    rank: "Diamond - Ascendant",
    language: "EN",
    mic: true,
    owner: "Mira",
    size: 5,
    members: ["Mira", "Noah", "Kai", "You"],
    status: "open"
  },
  {
    id: 103,
    title: "Helldivers quick run",
    game: "Helldivers 2",
    mode: "Suicide Mission",
    rank: "Any",
    language: "TR",
    mic: false,
    owner: "Aras",
    size: 4,
    members: ["Aras", "Selin", "You", "Can"],
    status: "ready"
  }
];

const choices = {
  games: ["Valorant", "CS2", "League", "Apex", "Helldivers 2", "Dota 2"],
  platforms: ["Steam", "Riot", "Discord", "PlayStation", "Xbox"],
  styles: ["Competitive", "Casual", "Ranked", "Co-op", "Late night"],
  voice: ["Mic on", "Text first", "Either"],
  hours: ["18:00 - 22:00", "20:00 - 00:00", "22:00 - 02:00"]
};

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const t = copy[language];
  const [tab, setTab] = useState<Tab>("onboarding");
  const [deckIndex, setDeckIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>(initialLobbies);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState({
    games: ["Valorant", "CS2"],
    platforms: ["Steam", "Discord"],
    styles: ["Competitive", "Late night"],
    voice: ["Mic on"],
    hours: ["20:00 - 00:00"]
  });
  const [draftLobby, setDraftLobby] = useState({
    title: "Tonight ranked stack",
    game: "CS2",
    mode: "Premier",
    rank: "Gold Nova - MG",
    size: 5,
    language: "TR/EN"
  });

  const currentPlayer = players[deckIndex];
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

  function toggleChoice(group: keyof typeof selected, value: string) {
    setSelected((current) => {
      const isSelected = current[group].includes(value);
      return {
        ...current,
        [group]: isSelected
          ? current[group].filter((item) => item !== value)
          : [...current[group], value]
      };
    });
  }

  function swipe(accepted: boolean) {
    if (!currentPlayer) return;

    if (accepted) {
      const matchExists = matches.some((match) => match.id === currentPlayer.id);
      if (!matchExists) {
        setMatches((current) => [
          ...current,
          {
            ...currentPlayer,
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
        ]);
      }
      setNotice(t.matchMade);
    } else {
      setNotice("");
    }

    setDeckIndex((current) => current + 1);
  }

  function resetDeck() {
    setDeckIndex(0);
    setNotice("");
  }

  function createLobby() {
    const nextLobby: Lobby = {
      id: Date.now(),
      title: draftLobby.title,
      game: draftLobby.game,
      mode: draftLobby.mode,
      rank: draftLobby.rank,
      language: draftLobby.language,
      mic: true,
      owner: "You",
      size: Number(draftLobby.size),
      members: ["You"],
      status: "open"
    };
    setLobbies((current) => [nextLobby, ...current]);
  }

  function joinLobby(id: number) {
    setLobbies((current) =>
      current.map((lobby) => {
        if (lobby.id !== id || lobby.members.includes("You") || lobby.status === "successful") {
          return lobby;
        }
        const members = [...lobby.members, "You"];
        return {
          ...lobby,
          members,
          status: members.length >= lobby.size ? "ready" : "open"
        };
      })
    );
  }

  function markSuccessful(id: number) {
    setLobbies((current) =>
      current.map((lobby) =>
        lobby.id === id ? { ...lobby, status: "successful" } : lobby
      )
    );
  }

  return (
    <main className="app-frame">
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
            <strong>{matches.length}</strong>
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
        </header>

        <div className="main-view">
          {tab === "onboarding" && (
            <section className="onboarding">
              <div className="panel">
                <h2>Find people who fit the session.</h2>
                <p>
                  Keep the profile practical: games, voice, hours and how you play
                  when the match gets tense.
                </p>
              </div>
              <ChoiceBlock
                title={t.games}
                options={choices.games}
                selected={selected.games}
                onToggle={(value) => toggleChoice("games", value)}
              />
              <ChoiceBlock
                title={t.platforms}
                options={choices.platforms}
                selected={selected.platforms}
                onToggle={(value) => toggleChoice("platforms", value)}
              />
              <ChoiceBlock
                title={t.style}
                options={choices.styles}
                selected={selected.styles}
                onToggle={(value) => toggleChoice("styles", value)}
              />
              <ChoiceBlock
                title={t.voice}
                options={choices.voice}
                selected={selected.voice}
                onToggle={(value) => toggleChoice("voice", value)}
              />
              <ChoiceBlock
                title={t.hours}
                options={choices.hours}
                selected={selected.hours}
                onToggle={(value) => toggleChoice("hours", value)}
              />
              <button className="primary-button" onClick={() => setTab("discover")} type="button">
                {t.startMatching}
                <ChevronRight size={18} />
              </button>
            </section>
          )}

          {tab === "discover" && (
            <section className="step-grid">
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
                    {t.accept}
                  </button>
                </>
              ) : (
                <div className="empty-state">
                  <p>{t.noMore}</p>
                  <button className="secondary-button" onClick={resetDeck} type="button">
                    {t.resetDeck}
                  </button>
                </div>
              )}
            </section>
          )}

          {tab === "matches" && (
            <section className="match-list">
              {matches.length === 0 ? (
                <div className="empty-state">{t.emptyMatches}</div>
              ) : (
                matches.map((match) => (
                  <article className="match-item" key={match.id}>
                    <div className="item-row">
                      <div>
                        <h3>{match.name}</h3>
                        <p>{match.games.slice(0, 2).join(" / ")} · {match.active}</p>
                      </div>
                      <span className="status-pill">{match.compatibility}%</span>
                    </div>
                    <div className="chat-box">
                      <div className="messages">
                        {match.messages.map((message, index) => (
                          <div className={`bubble ${message.from === "me" ? "me" : ""}`} key={index}>
                            {message.text}
                          </div>
                        ))}
                      </div>
                      <div className="composer">
                        <input aria-label={t.typeMessage} placeholder={t.typeMessage} />
                        <button type="button" title="Send">
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>
          )}

          {tab === "lobbies" && (
            <section className="step-grid">
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
                {lobbies.length === 0 ? (
                  <div className="empty-state">{t.emptyLobbies}</div>
                ) : (
                  lobbies.map((lobby) => (
                    <LobbyCard
                      key={lobby.id}
                      lobby={lobby}
                      t={t}
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
            onClick={() => setTab("onboarding")}
          />
          <NavButton
            active={tab === "discover"}
            icon={<Gamepad2 size={19} />}
            label={t.discover}
            onClick={() => setTab("discover")}
          />
          <NavButton
            active={tab === "matches"}
            icon={<MessageCircle size={19} />}
            label={t.matches}
            onClick={() => setTab("matches")}
          />
          <NavButton
            active={tab === "lobbies"}
            icon={<Users size={19} />}
            label={t.lobbies}
            onClick={() => setTab("lobbies")}
          />
        </nav>
      </section>
    </main>
  );
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

function PlayerCard({ player, t }: { player: Player; t: typeof copy.en }) {
  return (
    <article className="profile-card">
      <div className="identity-row">
        <div className="identity">
          <div className="avatar" style={{ background: player.accent }}>
            {player.initials}
          </div>
          <h2>
            {player.name}, {player.age}
          </h2>
          <p>{player.city}</p>
        </div>
        <span className="compat">{player.compatibility}%</span>
      </div>

      <div className="tag-row">
        {player.games.map((game) => (
          <span className="tag" key={game}>
            {game}
          </span>
        ))}
      </div>

      <p>{player.bio}</p>

      <div className="detail-grid">
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
  onJoin,
  onSuccess
}: {
  lobby: Lobby;
  t: typeof copy.en;
  onJoin: () => void;
  onSuccess: () => void;
}) {
  const joined = lobby.members.includes("You");
  const progress = Math.round((lobby.members.length / lobby.size) * 100);
  const label =
    lobby.status === "successful"
      ? t.closed
      : lobby.status === "ready"
        ? t.readyRoom
        : `${lobby.members.length}/${lobby.size}`;

  return (
    <article className="lobby-item">
      <div className="item-row">
        <div>
          <h3>{lobby.title}</h3>
          <p>
            {lobby.game} · {lobby.mode} · {lobby.rank}
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
      </div>
      <div className="progress" aria-label="Lobby progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p>{lobby.members.join(", ")}</p>
      {lobby.status === "successful" ? (
        <button className="secondary-button" disabled type="button">
          {t.successful}
        </button>
      ) : lobby.status === "ready" || lobby.owner === "You" ? (
        <button className="primary-button" onClick={onSuccess} type="button">
          {t.markSuccessful}
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
