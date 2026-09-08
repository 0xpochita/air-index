"use client";

import { Card, CardHeader } from "@/components/ui/Card";

const FIELD_CLASS =
  "w-full rounded-md border border-line bg-surface/80 px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle";
const LABEL_CLASS = "mb-1.5 block text-xs font-medium text-ink-subtle";

interface IdentityCardProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const IdentityCard = ({
  name,
  description,
  onNameChange,
  onDescriptionChange,
}: IdentityCardProps) => (
  <Card>
    <CardHeader title="Identity" />
    <div className="space-y-4 px-5 pb-5">
      <div>
        <label htmlFor="index-name" className={LABEL_CLASS}>
          Index name
        </label>
        <input
          id="index-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="DeFi Blue Chips"
          className={FIELD_CLASS}
        />
      </div>
      <div>
        <label htmlFor="index-description" className={LABEL_CLASS}>
          Description
        </label>
        <textarea
          id="index-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={2}
          placeholder="What does this index track, and why?"
          className={FIELD_CLASS}
        />
      </div>
    </div>
  </Card>
);
