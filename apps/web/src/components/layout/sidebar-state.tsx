import type { LinkProps, RegisteredRouter } from "@tanstack/react-router";
import {
  BanknoteArrowUp,
  ClockPlus,
  CreditCard,
  Handshake,
  House,
  type LucideProps,
  Wand,
} from "lucide-react";

export type IconType = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

export type NavType = {
  title: string;
  icon: IconType;
  url: LinkProps<RegisteredRouter>["to"];
};

export type SidebarDatatype = {
  header: NavType;
  navMain: NavType[];
};

export const sidebarData: SidebarDatatype = {
  header: {
    icon: Wand,
    title: "Pocket Pixie",
    url: "/dashboard",
  },
  navMain: [
    {
      title: "Dashboard",
      icon: House,
      url: "/dashboard",
    },
    {
      title: "Transaction",
      icon: BanknoteArrowUp,
      url: "/transaction",
    },
    {
      title: "Budget",
      icon: CreditCard,
      url: "/budget",
    },
    {
      title: "Recurrences",
      icon: ClockPlus,
      url: "/recurrence",
    },
    {
      title: "Split Pocket",
      icon: Handshake,
      url: "/split",
    },
  ],
};
