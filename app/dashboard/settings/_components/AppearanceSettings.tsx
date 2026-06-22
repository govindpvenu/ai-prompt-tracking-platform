"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Monitor, Moon, Palette, Radius, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";
type AccentId = "default" | "blue" | "emerald" | "rose" | "amber";
type RadiusId = "sm" | "md" | "lg";

const appearanceStorageKeys = {
  accent: "prompt-tracker-accent",
  radius: "prompt-tracker-radius",
};

const themeModes: Array<{
  id: ThemeMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const accentOptions: Array<{
  id: AccentId;
  label: string;
  swatch: string;
  primary?: string;
  primaryForeground?: string;
  ring?: string;
}> = [
  { id: "default", label: "Default", swatch: "oklch(0.205 0 0)" },
  {
    id: "blue",
    label: "Blue",
    swatch: "oklch(0.546 0.245 262.881)",
    primary: "oklch(0.546 0.245 262.881)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.707 0.165 254.624)",
  },
  {
    id: "emerald",
    label: "Emerald",
    swatch: "oklch(0.596 0.145 163.225)",
    primary: "oklch(0.596 0.145 163.225)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.765 0.177 163.223)",
  },
  {
    id: "rose",
    label: "Rose",
    swatch: "oklch(0.586 0.253 17.585)",
    primary: "oklch(0.586 0.253 17.585)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.712 0.194 13.428)",
  },
  {
    id: "amber",
    label: "Amber",
    swatch: "oklch(0.769 0.188 70.08)",
    primary: "oklch(0.769 0.188 70.08)",
    primaryForeground: "oklch(0.145 0 0)",
    ring: "oklch(0.828 0.189 84.429)",
  },
];

const radiusOptions: Array<{
  id: RadiusId;
  label: string;
  value: string;
}> = [
  { id: "sm", label: "Compact", value: "0.375rem" },
  { id: "md", label: "Default", value: "0.625rem" },
  { id: "lg", label: "Relaxed", value: "0.875rem" },
];

function getStoredOption<T extends string>(
  key: string,
  fallback: T,
  allowedValues: readonly T[],
) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const storedValue = window.localStorage.getItem(key) as T | null;
  return storedValue && allowedValues.includes(storedValue)
    ? storedValue
    : fallback;
}

function applyAccent(accentId: AccentId) {
  const root = document.documentElement;
  const accent = accentOptions.find((option) => option.id === accentId);

  if (!accent || accent.id === "default") {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-foreground");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--sidebar-primary");
    window.localStorage.removeItem(appearanceStorageKeys.accent);
    return;
  }

  root.style.setProperty("--primary", accent.primary ?? accent.swatch);
  root.style.setProperty(
    "--primary-foreground",
    accent.primaryForeground ?? "oklch(0.985 0 0)",
  );
  root.style.setProperty("--ring", accent.ring ?? accent.swatch);
  root.style.setProperty("--sidebar-primary", accent.primary ?? accent.swatch);
  window.localStorage.setItem(appearanceStorageKeys.accent, accent.id);
}

function applyRadius(radiusId: RadiusId) {
  const root = document.documentElement;
  const radius = radiusOptions.find((option) => option.id === radiusId);

  if (!radius || radius.id === "md") {
    root.style.removeProperty("--radius");
    window.localStorage.removeItem(appearanceStorageKeys.radius);
    return;
  }

  root.style.setProperty("--radius", radius.value);
  window.localStorage.setItem(appearanceStorageKeys.radius, radius.id);
}

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [accent, setAccent] = useState<AccentId>("default");
  const [radius, setRadius] = useState<RadiusId>("md");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedAccent = getStoredOption<AccentId>(
        appearanceStorageKeys.accent,
        "default",
        accentOptions.map((option) => option.id),
      );
      const storedRadius = getStoredOption<RadiusId>(
        appearanceStorageKeys.radius,
        "md",
        radiusOptions.map((option) => option.id),
      );

      applyAccent(storedAccent);
      applyRadius(storedRadius);
      setAccent(storedAccent);
      setRadius(storedRadius);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const selectedTheme = useMemo<ThemeMode>(() => {
    if (theme === "light" || theme === "dark" || theme === "system") {
      return theme;
    }

    return "system";
  }, [theme]);

  const handleAccentChange = useCallback((accentId: AccentId) => {
    applyAccent(accentId);
    setAccent(accentId);
  }, []);

  const handleRadiusChange = useCallback((radiusId: RadiusId) => {
    applyRadius(radiusId);
    setRadius(radiusId);
  }, []);

  const handleReset = useCallback(() => {
    setTheme("system");
    applyAccent("default");
    applyRadius("md");
    setAccent("default");
    setRadius("md");
  }, [setTheme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Label>Theme</Label>
          </div>
          <ButtonGroup className="grid w-full grid-cols-3">
            {themeModes.map((mode) => {
              const Icon = mode.icon;
              const selected = selectedTheme === mode.id;

              return (
                <Button
                  key={mode.id}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  aria-pressed={selected}
                  onClick={() => setTheme(mode.id)}
                  className="h-10"
                >
                  <Icon className="h-4 w-4" />
                  {mode.label}
                </Button>
              );
            })}
          </ButtonGroup>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Label>Accent</Label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {accentOptions.map((option) => {
              const selected = accent === option.id;

              return (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  aria-pressed={selected}
                  onClick={() => handleAccentChange(option.id)}
                  className={cn(
                    "h-12 justify-start gap-2",
                    selected && "border-primary ring-2 ring-ring/30",
                  )}
                >
                  <span
                    className="grid size-5 shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: option.swatch }}
                  >
                    {selected && (
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    )}
                  </span>
                  {option.label}
                </Button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Radius className="h-4 w-4 text-muted-foreground" />
            <Label>Corner Radius</Label>
          </div>
          <ButtonGroup className="grid w-full grid-cols-3">
            {radiusOptions.map((option) => {
              const selected = radius === option.id;

              return (
                <Button
                  key={option.id}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  aria-pressed={selected}
                  onClick={() => handleRadiusChange(option.id)}
                  className="h-10"
                >
                  {option.label}
                </Button>
              );
            })}
          </ButtonGroup>
        </section>

        <section className="rounded-lg border bg-muted/40 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-primary" />
              <div className="h-2 w-40 rounded-full bg-muted-foreground/30" />
              <div className="h-2 w-32 rounded-full bg-muted-foreground/20" />
            </div>
            <div className="flex gap-2">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="outline">
                Outline
              </Button>
            </div>
          </div>
        </section>

        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4" />
          Reset Appearance
        </Button>
      </CardContent>
    </Card>
  );
}
