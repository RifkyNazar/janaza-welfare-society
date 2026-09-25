export type LeadershipMember = {
  position: string;
  name: string;
  contact: string;
  responsibility: string;
  photoSrc: string | null;
};

export const leadershipTeam: LeadershipMember[] = [
  {
    position: "President",
    name: "MHS. Hameed",
    contact: "0777378753",
    responsibility:
      "Leads all administrative and service activities of the organization and guides the organization toward achieving its objectives and plans.",
    photoSrc: null,
  },
  {
    position: "Secretary",
    name: "SM. Firthous",
    contact: "0774203109",
    responsibility:
      "Handles administrative and coordination activities, including meetings, documentation, and official communications.",
    photoSrc: null,
  },
  {
    position: "Treasurer",
    name: "ABM. Haroon",
    contact: "0775525806",
    responsibility:
      "Manages the organization's income and expenses, maintains financial records and documents, and ensures financial transparency.",
    photoSrc: null,
  },
];
