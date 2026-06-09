"use client";

import { motion } from "framer-motion";
import { Save, Key, Bell, Sliders } from "lucide-react";

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={item}
      className="rounded-xl border border-[#1B2030] bg-[#0F1218] p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/20">
          <Icon className="h-4 w-4 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#E8ECF4]">{title}</h3>
          <p className="text-xs text-[#8892A6]">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#8892A6]">{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  placeholder,
  type = "text",
  defaultValue,
}: {
  placeholder: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className="w-full rounded-lg border border-[#1B2030] bg-[#07080B] px-3 py-2 text-sm text-[#E8ECF4] placeholder-[#8892A6]/50 outline-none transition-colors focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
    />
  );
}

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E8ECF4]">Settings</h1>
          <p className="mt-1 text-sm text-[#8892A6]">
            Configure screening thresholds, API keys, and notification
            preferences
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#07080B] transition-all hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-400/20">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } },
        }}
        className="space-y-6"
      >
        {/* Screening Thresholds */}
        <SettingsSection
          title="Screening Thresholds"
          description="Control which filings pass your screen"
          icon={Sliders}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldGroup label="Minimum 30-Day ADV">
              <TextInput placeholder="15000" type="number" defaultValue="15000" />
            </FieldGroup>
            <FieldGroup label="Lookback (Days)">
              <TextInput placeholder="90" type="number" defaultValue="90" />
            </FieldGroup>
            <FieldGroup label="Market Tiers">
              <TextInput placeholder="OTCQX, OTCQB, PINK_CURRENT" defaultValue="OTCQX, OTCQB, PINK_CURRENT" />
            </FieldGroup>
          </div>
        </SettingsSection>

        {/* API Keys */}
        <SettingsSection
          title="API Keys"
          description="External service credentials for data enrichment"
          icon={Key}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Polygon.io API Key">
              <TextInput placeholder="pk_..." type="password" />
            </FieldGroup>
            <FieldGroup label="OpenAI API Key">
              <TextInput placeholder="sk-..." type="password" />
            </FieldGroup>
            <FieldGroup label="SEC User-Agent">
              <TextInput
                placeholder="EDGAR Insider Scout contact@yourdomain.com"
                defaultValue="EDGAR Insider Scout contact@yourdomain.com"
              />
            </FieldGroup>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          title="Notifications"
          description="Webhook endpoints for real-time alerts"
          icon={Bell}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Slack Webhook URL">
              <TextInput placeholder="https://hooks.slack.com/services/..." />
            </FieldGroup>
            <FieldGroup label="Discord Webhook URL">
              <TextInput placeholder="https://discord.com/api/webhooks/..." />
            </FieldGroup>
          </div>
          <div className="mt-4">
            <FieldGroup label="Digest Cadence">
              <select className="w-full rounded-lg border border-[#1B2030] bg-[#07080B] px-3 py-2 text-sm text-[#E8ECF4] outline-none transition-colors focus:border-cyan-400/40">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="realtime">Real-time</option>
              </select>
            </FieldGroup>
          </div>
        </SettingsSection>
      </motion.div>
    </div>
  );
}
