import type { Metadata } from "next";
import { GuestMenu } from "@/components/carte/GuestMenu";

export const metadata: Metadata = {
  title: "Le Man",
  description: "Le Man",
};

export default function CartePage() {
  return <GuestMenu />;
}
