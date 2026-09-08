import type { Metadata } from "next";
import { CreatePage } from "@/components/pages/create";

export const metadata: Metadata = {
  title: "Create an index",
  description:
    "Publish a crypto index fund as an ENS name with readable onchain composition.",
};

export default function CreateRoute() {
  return <CreatePage />;
}
