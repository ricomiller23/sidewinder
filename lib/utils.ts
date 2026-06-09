import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFormType(type?: string) {
  if (!type) return "Form 4";
  const map: Record<string, string> = {
    F3: "Form 3", F3A: "Form 3/A", F4: "Form 4", F4A: "Form 4/A", F5: "Form 5",
    S1: "S-1", S1A: "S-1/A", SC13D: "13D", SC13G: "13G",
    F144: "Form 144", F8K: "8-K", DEF14A: "DEF 14A", F1U: "1-U",
  };
  return map[type] || (type.startsWith("F") ? type.replace("F", "Form ") : type);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function getScoreBandColor(band: string): string {
  switch (band) {
    case 'HOT': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'WARM': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'MONITOR': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'NEW': return 'text-cyan-400 bg-cyan-400/10';
    case 'QUEUED': return 'text-blue-400 bg-blue-400/10';
    case 'CONTACTED': return 'text-emerald-400 bg-emerald-400/10';
    case 'POSSIBLE_INVENTORY': return 'text-amber-400 bg-amber-400/10';
    case 'CLOSED_WON': return 'text-green-400 bg-green-400/10';
    case 'DEAD': return 'text-zinc-500 bg-zinc-500/10';
    default: return 'text-zinc-400 bg-zinc-400/10';
  }
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}
