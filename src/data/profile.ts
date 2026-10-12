/**
 * Curated profile facts that are not simple lists.
 * Lists (publications, patents, books, reviewer, tools...) come from legacy.json,
 * which scripts/extract_profile.py generates from the legacy profile page.
 */

export interface Role {
  period: string;
  title: string;
  org: string;
  detail?: string;
}

export interface Degree {
  year: number;
  title: string;
  field: string;
  org: string;
  detail?: string;
}

export type ProjectStatus = "Completed" | "Ongoing" | "Submitted";

export interface Project {
  title: string;
  amount: string;
  amountLabel: "Sanctioned" | "Proposed";
  role: "Principal Investigator" | "Co-Investigator";
  agency: string;
  status: ProjectStatus;
}

/** A frequency band Dr. Mishra's papers work in. `query` seeds the publication search. */
export interface Band {
  id: string;
  label: string;
  startGHz: number;
  endGHz: number;
  query: string;
}

export const identity = {
  name: "Dr. Brijesh Mishra",
  role: "Associate Professor, Electronics and Communication Engineering",
  org: "School of Engineering and Technology, CMR University, Bengaluru",
  credentials: ["IEEE Senior Member", "IETE Fellow"],
  photo: "brijesh.jpg",
  /** Same portrait with the backdrop removed, so the radiation pattern can sit behind the figure. */
  photoCutout: "brijesh.webp",
  summary:
    "Designs antennas and RF devices that make 5G, mmWave and terahertz links practical: compact MIMO arrays, reconfigurable and energy-harvesting antennas, and machine-learning and RIS-assisted designs.",
} as const;

export const links = {
  scholar: "https://scholar.google.com/citations?user=wyrOw28AAAAJ&hl=en",
  orcid: "https://orcid.org/0000-0002-2535-7159",
  emailInstitutional: "brijesh.m@cmr.edu.in",
  emailPersonal: "brijesh.mishra0933@gmail.com",
  emailIeee: "brijeshmishra@ieee.org",
  university: "https://www.cmr.edu.in/",
  legacy: "https://brijeshmishra1.github.io/Dr._Brijesh_mishra/",
} as const;

/** Google Scholar, read on 2026-10-12. */
export const scholar = { citations: 989, hIndex: 19, i10Index: 27, asOf: "October 2026" } as const;

export const bio: readonly string[] = [
  "Dr. Brijesh Mishra received his M.Tech. in Electronics Engineering (2012) and PhD in Microwave Engineering (2018) from the University of Allahabad, a Central University. He is a Senior Member of IEEE and a Fellow of IETE.",
  "He is an Associate Professor in the Department of Electronics and Communication Engineering at the School of Engineering and Technology, CMR University, Bengaluru. Earlier he was Associate Professor and Head of Department at Shambhunath Institute of Engineering and Technology, and Assistant Professor (NPIU-MHRD) at Madan Mohan Malaviya University of Technology, Gorakhpur.",
  "His work covers the modelling, simulation and fabrication of RF, microwave and IoT devices: microstrip patch, reconfigurable, MIMO, harvesting and THz antennas, filters and couplers, graphene antennas, and machine-learning and RIS-assisted antennas. He has completed projects funded by NPIU and the World Bank, and has led or organised IEEE, Springer and Taylor & Francis conferences.",
];

export const experience: readonly Role[] = [
  {
    period: "Nov 2023 – present",
    title: "Associate Professor",
    org: "Department of ECE, School of Engineering and Technology, CMR University, Bengaluru",
  },
  {
    period: "Oct 2021 – Oct 2023",
    title: "Associate Professor and Head of Department",
    org: "Department of ECE, Shambhunath Institute of Engineering and Technology (SIET), Prayagraj",
  },
  {
    period: "Sep 2018 – Sep 2021",
    title: "Assistant Professor (NPIU-MHRD, on contract)",
    org: "Department of ECE, Madan Mohan Malaviya University of Technology, Gorakhpur",
  },
  {
    period: "Jan 2012 – Sep 2018",
    title: "Assistant Professor",
    org: "Department of ECE, Shambhunath Institute of Engineering and Technology (SIET), Prayagraj",
    detail: "Affiliated to Uttar Pradesh Technical University",
  },
];

export const education: readonly Degree[] = [
  {
    year: 2018,
    title: "PhD",
    field: "Microwave Engineering",
    org: "JK Institute of Applied Physics and Technology, University of Allahabad (Central University)",
    detail: "Thesis: Modelling, Analysis and Characterization of Microwave Devices using Simulation Techniques",
  },
  {
    year: 2012,
    title: "M.Tech. (Honours)",
    field: "Electronics Engineering",
    org: "JK Institute of Applied Physics and Technology, University of Allahabad (Central University)",
  },
  {
    year: 2010,
    title: "B.Tech.",
    field: "Electronics and Communication",
    org: "Uttar Pradesh Technical University",
    detail: "Qualified GATE in 2010",
  },
];

export const projects: readonly Project[] = [
  {
    title: "Design and development of machine learning and reconfigurable intelligent surface (RIS) driven wideband MIMO antenna for energy harvesting applications",
    amount: "₹37,32,000",
    amountLabel: "Proposed",
    role: "Principal Investigator",
    agency: "VGST, India",
    status: "Submitted",
  },
  {
    title: "Design and fabrication of eight port MIMO antenna with metasurface reflector/absorber for wireless and millimeter wave applications",
    amount: "₹2,00,000",
    amountLabel: "Sanctioned",
    role: "Principal Investigator",
    agency: "CMRU Chancellor's Scheme, CMR University",
    status: "Ongoing",
  },
  {
    title: "Development of IoT controlled frequency/pattern reconfigurable MIMO antenna for energy harvesting systems",
    amount: "₹18,97,000",
    amountLabel: "Sanctioned",
    role: "Co-Investigator",
    agency: "The World Bank and MHRD India",
    status: "Completed",
  },
  {
    title: "Testbed design for spectral sensing of cognitive radio with 5G applications",
    amount: "₹17,75,000",
    amountLabel: "Sanctioned",
    role: "Principal Investigator",
    agency: "The World Bank and MHRD India",
    status: "Completed",
  },
];

export const editorial: readonly string[] = [
  "Editorial board: Scientific Reports (Nature Portfolio)",
  "Editorial board: Scientific Reviews (Nature Portfolio)",
  "Editorial board: Discover Internet of Things (Springer)",
  "Editorial board: Bentham Science journals",
  "Associate Editor: IEIE Transactions on Smart Processing & Computing",
];

export const conferences: readonly { name: string; role: string; publisher: string }[] = [
  { name: "ICE3-2020", role: "Organising Track Chair", publisher: "IEEE" },
  { name: "ICVMWT-2021", role: "Organiser and volume editor", publisher: "Springer" },
  { name: "ICISSI-2022", role: "Organiser and volume editor", publisher: "Taylor & Francis" },
  { name: "ICICKE-2025", role: "Track Chair and Organising Secretary", publisher: "IEEE" },
  { name: "ICICKE-2026", role: "Track Chair and Organising Secretary", publisher: "IEEE" },
  { name: "ATIS 2026", role: "Track Chair and Organising Secretary", publisher: "Springer" },
];

/**
 * Bands that appear in the titles of the papers. Edges are indicative, drawn
 * for orientation on the log scale; they are not regulatory definitions.
 */
export const bands: readonly Band[] = [
  { id: "ism", label: "2.4 / 5.8 GHz", startGHz: 2.4, endGHz: 5.9, query: "5.8" },
  { id: "sub6", label: "Sub-6 GHz · n78", startGHz: 0.7, endGHz: 7, query: "sub-6" },
  { id: "mmwave", label: "mmWave · 28 / 38 GHz", startGHz: 24, endGHz: 100, query: "mmWave" },
  { id: "thz", label: "Terahertz", startGHz: 100, endGHz: 10000, query: "terahertz" },
];

export const sectionIds = [
  "about",
  "research",
  "experience",
  "publications",
  "patents",
  "projects",
  "service",
  "toolkit",
  "contact",
] as const;

export type SectionId = (typeof sectionIds)[number];
