"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { useTheme, type ThemePref } from "@/lib/theme";

export function PreferencesTab() {
  const { pref, resolved, setPref } = useTheme();
  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader title="Appearance" description="Stored in this browser only." />
        <CardBody className="space-y-2 pt-3">
          <Segmented<ThemePref>
            label="Theme"
            value={pref}
            onValueChange={setPref}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "system", label: "Match system" },
            ]}
          />
          <p className="text-xs text-text-3" aria-live="polite">
            {pref === "system" ? `Following your system setting (currently ${resolved}).` : `Always ${resolved}.`}
          </p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Motion and accessibility" />
        <CardBody className="pt-2 text-[13px] text-text-2">
          Animations follow your operating system&apos;s “reduce motion” setting. Every status uses an icon and text as well as colour, and every action is reachable from the keyboard. Press <kbd className="rounded border border-hairline px-1 font-mono text-[11px]">⌘K</kbd> or <kbd className="rounded border border-hairline px-1 font-mono text-[11px]">Ctrl K</kbd> to jump anywhere.
        </CardBody>
      </Card>
    </div>
  );
}
