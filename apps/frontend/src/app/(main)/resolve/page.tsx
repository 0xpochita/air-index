import type { Metadata } from "next";
import { ResolvePage } from "@/components/pages/resolve";

export const metadata: Metadata = {
  title: "Resolve",
  description:
    "Resolve any name under airindex.eth through the ENS Universal Resolver.",
};

export default function ResolveRoute() {
  return <ResolvePage />;
}
