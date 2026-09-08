"use client";

import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

const CHIP_CLASS =
  "flex shrink-0 items-center gap-2 rounded-full border border-canvas/70 bg-surface/90 py-1.5 pr-3 pl-1.5 text-sm font-semibold text-ink";

interface AssetChipProps {
  icon: ReactNode;
  label: string;
}

export const AssetChip = ({ icon, label }: AssetChipProps) => (
  <span className={CHIP_CLASS}>
    {icon}
    {label}
  </span>
);

interface AssetSelectProps<Value extends string> {
  icon: ReactNode;
  label: string;
  fieldLabel: string;
  value: Value;
  options: ReadonlyArray<{ value: Value; label: string }>;
  onChange: (value: Value) => void;
}

export const AssetSelect = <Value extends string>({
  icon,
  label,
  fieldLabel,
  value,
  options,
  onChange,
}: AssetSelectProps<Value>) => (
  <span className={`${CHIP_CLASS} relative`}>
    {icon}
    {label}
    <CaretDownIcon
      size={14}
      weight="bold"
      aria-hidden
      className="text-ink-subtle"
    />
    <select
      aria-label={fieldLabel}
      value={value}
      onChange={(event) => onChange(event.target.value as Value)}
      className="absolute inset-0 cursor-pointer opacity-0"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </span>
);
