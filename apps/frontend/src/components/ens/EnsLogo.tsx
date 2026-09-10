import Image from "next/image";
import { cn } from "@/lib/cn";

interface EnsLogoProps {
  size?: number;
  className?: string;
}

/**
 * The ENS mark. Sits to the left of a name so it reads as a name the protocol
 * resolves, rather than as a string this app made up.
 */
export const EnsLogo = ({ size = 14, className }: EnsLogoProps) => (
  <Image
    src="/tokens/ens.png"
    alt=""
    width={size}
    height={size}
    className={cn("shrink-0 rounded-full", className)}
  />
);
