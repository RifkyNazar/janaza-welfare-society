import { T } from "@/components/public-language";

export function PortalStatus({ value }: { value: string }) {
  const label = value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return <T text={label} />;
}
