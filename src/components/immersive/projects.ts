export type Project = {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string;
  tags: string[];
  link?: string;
  placeholder: string;
  objectPosition?: string;
  aspect?: string;
  env: "audio" | "nature" | "neon" | "paper" | "retro" | "cosmos";
};

export const projects: Project[] = [
  {
    id: "soniq-space",
    title: "Soniq Space - Audio-Reactive Visualiser",
    category: "Creative Coding · Full Stack",
    date: "2024 – 2025",
    description:
      "Soniq Space is a web app that transforms your audio file into an inviting immersive, interactive 3D visual experience. The core purpose is to create a personalised audio-reactive room where colours, shapes, particles, and lighting respond in real time to sound. Users can upload audio, customise visuals, and save unique rooms to revisit in a scrollable gallery.",
    tags: ["Three.js", "JWT", "GLB", "Node.js", "MongoDB", "Express"],
    placeholder: "/projects/soniq_space.jpg",
    env: "audio",
    objectPosition: "center 60%",
    link: "https://github.com/Righlow/Soniq-space3",
  },
  {
    id: "plandria",
    title: "Plandria — Sustainable E-Commerce",
    category: "Brand + E-Commerce · Full Stack",
    date: "2025 – 2026",
    description:
      "Full-stack e-commerce for an eco brand selling hand-crafted candles and pots. Once the candle burns, the vessel becomes a planter. Stripe checkout, bcrypt auth, dual dark/light theme, and a full admin dashboard.",
    tags: ["Node.js", "MongoDB", "Stripe", "bcryptjs", "EJS", "CSS3", "Cloudflare"],
    placeholder: "/projects/plandriaWebsite.png",
    objectPosition: "center center",
    link: "https://plandria.co.uk/",
    env: "nature",
  },
  {
    id: "mih-healthcare",
    title: "MIH — Healthcare Technologies",
    category: "Client Work · Moloele Investment Holdings",
    date: "Jun 2026",
    description:
      "Corporate site for MIH's Healthcare Technologies division, Moloele Investment Holdings (Pty) Ltd. An elegant, editorial brand experience communicating healthcare systems designed to transform delivery across five strategic pillars, backed by a Node.js/Express enquiry system.",
    tags: ["Node.js", "Express", "Nodemailer", "Responsive Design", "Brand Identity"],
    placeholder: "/projects/mih-healthcare.png",
    objectPosition: "center 30%",
    link: "https://www.mih-healthcare.co.za",
    env: "paper",
  },
  {
    id: "perceptor",
    title: "Perceptor — Interactive Client Pitch",
    category: "Client Work · MangoMoon × MIH Consulting",
    date: "2026",
    description:
      "A scroll-based interactive pitch website. Animated section transitions, live stat counters, and visual storytelling across problem, solution, and workflow sections.",
    tags: ["HTML5", "CSS3", "JavaScript", "Netlify", "Scroll Animation"],
    link: "https://perceptor.netlify.app",
    placeholder: "/projects/perceptor.png",
    env: "neon",
  },
];
