// config.js — edit everything here; App.jsx never needs to change for content.

export const VIDEO = {
  src: "pirate.mp4",        // put your video in /public and name it pirate.mp4 (or change this)
  playbackRate: 0.7,         // speed while travelling between events
  // Tip: open the site with ?debug at the end of the URL to see the live video
  // time on screen, then fine-tune each event's `stopAt` below.
};

export const SITE = {
  badge: "Technitude 2026",
  title: "Pirates of Caribbean",
  tagline: "Five games. One mission. One legendary treasure.",
  overview:
    "Gather your mates and join the biggest pirate-themed event on campus. Battle it out in chess, box cricket, FIFA and naval warfare ,then hunt for the treasure that ends it all.",
  meta: [
    { label: "Date", value: "7 Oct 2026" },
    { label: "Venue", value: "DMCE" },
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
    emoji: "",
    title: "Chess",
    tagline: "Outwit the captain.",
    description:
      "Get ready for an exciting Online Chess Tournament hosted on Lichess",
    registerUrl: "https://forms.gle/JHxCgY4y6ybt5m9s7",
    image: "/Online Chess.jpeg",
    stopAt: 2.3,
  },
  {
    id: "box-cricket",
    emoji: "",
    title: "Box Cricket",
    tagline: "Fast overs. Fast results.",
    description:
      "Step onto the field and put your batting, bowling, and teamwork to the test. Every run and every wicket brings you closer to victory",
    registerUrl: "https://forms.gle/VCYwncC4SJrXtqb96",
    image: "/Box Cricket.jpeg",
    stopAt: 3.4,
  },
  {
    id: "ps5-fifa",
    emoji: "",
    title: "PS5 FIFA",
    tagline: "Controller in hand, glory in sight.",
    description:
      "Take control of your team and compete in an intense virtual football showdown. Build your strategy, dominate the pitch, and score your way to glory.",
    registerUrl: "https://forms.gle/Kf4fd66hNaDNygwF8",
    image: "/PS5 Fifa.jpeg",
    stopAt: 4.4,
  },
  {
    id: "ship-battle",
    emoji: "",
    title: "Ship Battle",
    tagline: "Fire the cannons!",
    description:
      "Prepare your crew for an epic battle across the seas where strategy and quick decisions decide your fate. Defeat your rivals and rule the waves.",
    registerUrl: "https://forms.gle/bLbphRA11x6V6oAA9",
    image: "/Ship Battle.jpeg",
    stopAt: 6.3,
  },
  {
    id: "treasure-hunt",
    emoji: "",
    title: "The Lost Treasure of Digital Sea",
    tagline: "Clues are everywhere.",
    description:
      "Follow the clues, solve the puzzles, and uncover secrets hidden across the pirate's domain. Only the sharpest crew will find the legendary treasure",
    registerUrl: "https://forms.gle/D9P3AyzxS5kigwAe7",
    image: "/Lost Treasure of Digital Sea.jpeg",
    stopAt: 9.3,
  },
];

// Shown alongside the event icons in the treasure-chest reveal at the very end.
export const SOCIALS = [
  { id: "instagram", image: "/instagram.png", link: "https://instagram.com/dmce_gits" },
  { id: "linkedin", image: "/linkedln.png", link: "https://linkedin.com/in/gits-dmce" },
  { id: "website", image: "/website.png", link: "https://dmcegits26.vercel.app/" },
];

// The moment after the video ends: the chest "spills" these out (one per
// event, then the socials) and they settle at the bottom of the screen.
// Built automatically from EVENTS + SOCIALS — edit those two above instead.
export const CHEST_ITEMS = [
  ...SOCIALS,
];

export const CHEST = {
  heading: "The treasure is all yours.",
  sub: "Find us online.",
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