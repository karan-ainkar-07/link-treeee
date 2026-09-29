// config.js — edit everything here; App.jsx never needs to change for content.

export const VIDEO = {
  src: "/pirate.mp4",        // put your video in /public and name it pirate.mp4 (or change this)
  playbackRate: 0.7,         // speed while travelling between events
  // Tip: open the site with ?debug at the end of the URL to see the live video
  // time on screen, then fine-tune each event's `stopAt` below.
};

export const SITE = {
  badge: "☠ Annual Fest 2026",
  title: "Set Sail for Glory",
  tagline: "Five games. One crew. One legendary treasure.",
  overview:
    "Gather your mates and join the biggest pirate-themed event on campus. Battle it out in chess, box cricket, FIFA and naval warfare — then hunt for the treasure that ends it all.",
  meta: [
    { label: "Date", value: "12–13 Oct 2026" },
    { label: "Venue", value: "College Main Ground" },
    { label: "Events", value: "5" },
  ],
  scrollHint: "Scroll to set sail",
  registerLabel: "Register Now",
};

// stopAt = second in the video where that event's visual is on screen.
// description = the sample text shown in the bottom panel for that event.
// image = shown full-screen instead of the video if the video fails to load,
//         and reused as this event's icon in the treasure-chest reveal at the end.
export const EVENTS = [
  {
    id: "chess",
    emoji: "♟️",
    title: "Chess",
    tagline: "Outwit the captain.",
    description:
      "A knockout chess tournament for anyone who thinks three moves ahead. Sacrifice a pawn, spring a trap, and claim the crown — 12 Oct, 10:00 AM, solo entry, ₹50.",
    registerUrl: "https://forms.gle/your-chess-form",
    image: "/sample.png",
    stopAt: 2.3,
  },
  {
    id: "box-cricket",
    emoji: "🏏",
    title: "Box Cricket",
    tagline: "Fast overs. Loud crowds.",
    description:
      "6-a-side box cricket with tight boundaries and no mercy. Every ball counts — 12 Oct, 2:00 PM, teams of 6, ₹300 per team.",
    registerUrl: "https://forms.gle/your-cricket-form",
    image: "/sample.png",
    stopAt: 3.4,
  },
  {
    id: "ps5-fifa",
    emoji: "🎮",
    title: "PS5 FIFA",
    tagline: "Controller in hand, glory in sight.",
    description:
      "1v1 FIFA on PS5 in a straight knockout bracket. Bring your best squad and your best trash talk — 13 Oct, 11:00 AM, solo entry, ₹100.",
    registerUrl: "https://forms.gle/your-fifa-form",
    image: "/sample.png",
    stopAt: 4.4,
  },
  {
    id: "ship-battle",
    emoji: "⚓",
    title: "Ship Battle",
    tagline: "Fire the cannons!",
    description:
      "A team strategy battle where your fleet takes on rival crews. Plan your attack, hold your line, sink the enemy — 13 Oct, 1:00 PM, teams of 3–4, ₹200 per team.",
    registerUrl: "https://forms.gle/your-ship-form",
    image: "/sample.png",
    stopAt: 6.3,
  },
  {
    id: "treasure-hunt",
    emoji: "💰",
    title: "Treasure Hunt",
    tagline: "X marks the spot.",
    description:
      "Follow the clues across campus and be the first crew to unearth the chest. Sharp eyes and faster feet win the day — 13 Oct, 4:00 PM, teams of 3–5, ₹150 per team.",
    registerUrl: "https://forms.gle/your-treasure-form",
    image: "/sample.png",
    stopAt: 9.3,
  },
];

// Shown alongside the event icons in the treasure-chest reveal at the very end.
export const SOCIALS = [
  { id: "instagram", image: "/sample.png", link: "https://instagram.com/yourhandle" },
  { id: "linkedin", image: "/sample.png", link: "https://linkedin.com/company/yourpage" },
  { id: "discord", image: "/sample.png", link: "https://discord.gg/yourinvite" },
];

// The moment after the video ends: the chest "spills" these out (one per
// event, then the socials) and they settle at the bottom of the screen.
// Built automatically from EVENTS + SOCIALS — edit those two above instead.
export const CHEST_ITEMS = [
  ...EVENTS.map((e) => ({ id: e.id, image: e.image, link: e.registerUrl })),
  ...SOCIALS,
];

export const CHEST = {
  heading: "The treasure is yours.",
  sub: "Tap a piece to register, or find us online.",
};

export const FOOTER = {
  heading: "Fair winds, sailor.",
  about:
    "Built by the organising crew. Questions, sponsorships or last-minute changes — reach out and we'll steer you right.",
  contacts: [
    { label: "Coordinator", value: "Your Name — +91 00000 00000" },
    { label: "Email", value: "events@yourcollege.edu" },
    { label: "Venue", value: "College Main Ground" },
  ],
  faqs: [
    { q: "Can I join multiple events?", a: "Yes, as long as the timings don't clash." },
    { q: "Is there an entry fee for spectators?", a: "No, spectators enter free." },
    { q: "Do I need to bring my own equipment?", a: "Only for cricket — everything else is provided." },
  ],
  links: [
    { label: "Instagram", url: "https://instagram.com/yourhandle" },
    { label: "WhatsApp Group", url: "https://chat.whatsapp.com/yourlink" },
    { label: "Rulebook", url: "https://example.com/rulebook" },
  ],
  copyright: "© 2026 Your Club Name. All rights reserved.",
};