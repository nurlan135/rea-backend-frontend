"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-4 w-4" />;
    }
    if (theme === "dark" || resolvedTheme === "dark") {
      return <Moon className="h-4 w-4" />;
    }
    return <Sun className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (theme === "system") {
      return "Sistem teması";
    }
    return theme === "dark" ? "Tünd tema" : "İşıqlı tema";
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
      title={getLabel()}
    >
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  );
}

export function ThemeToggleDropdown() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light", label: "İşıqlı", icon: Sun },
    { value: "dark", label: "Tünd", icon: Moon },
    { value: "system", label: "Sistem", icon: Monitor },
  ] as const;

  return (
    <div className="flex flex-col space-y-1 p-2">
      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
        Tema seçimi
      </div>
      {themes.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={theme === value ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setTheme(value)}
          className="w-full justify-start px-2 py-1.5 text-sm font-normal"
        >
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}