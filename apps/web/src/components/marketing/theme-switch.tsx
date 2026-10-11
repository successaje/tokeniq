"use client";

import { Segmented } from "@/components/ui/segmented";
import { useTheme, type ThemePref } from "@/lib/theme";

export function ThemeSwitch() {
  const { pref, setPref } = useTheme();
  return (
    <Segmented<ThemePref>
      size="sm"
      label="Appearance"
      value={pref}
      onValueChange={setPref}
      options={[
        { value: "system", label: "System" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
    />
  );
}
