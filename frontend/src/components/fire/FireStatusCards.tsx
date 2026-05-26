import type { FireConditionsViewModel } from "@/lib/fireConditionsAdapter";
import type { SemanticTier } from "@/lib/dashboardSemantic";
import { statLabelToneClasses, statToneClasses } from "@/lib/semanticStyles";

function containmentTier(pct: number): SemanticTier {
  if (pct >= 75) return "safe";
  if (pct > 0) return "warning";
  return "neutral";
}

function FireMiniCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: SemanticTier;
}) {
  return (
    <div className={`rounded-2xl p-4 ${statToneClasses[tone]}`}>
      <p
        className={`text-[10px] font-semibold uppercase tracking-wider sm:text-xs ${statLabelToneClasses[tone]}`}
      >
        {label}
      </p>
      <p className="mt-1.5 break-words text-base font-bold leading-snug text-[var(--foreground)] sm:text-lg">
        {value}
      </p>
    </div>
  );
}

export function FireStatusCards({ data }: { data: FireConditionsViewModel }) {
  const { latestIncident, latestAlert } = data;
  const containTone = containmentTier(latestIncident.containmentPct);
  const alertTone = latestAlert.timestampIso ? latestAlert.tier : "neutral";
  const windTone = latestAlert.timestampIso ? latestAlert.tier : "neutral";
  const humidityTone = latestAlert.timestampIso ? latestAlert.tier : "neutral";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <FireMiniCard label="Fire name" value={latestIncident.name} tone="neutral" />
      <FireMiniCard
        label="Acres burned"
        value={latestIncident.acres.toLocaleString()}
        tone="neutral"
      />
      <FireMiniCard
        label="Containment"
        value={`${latestIncident.containmentPct.toFixed(1)}%`}
        tone={containTone}
      />
      <FireMiniCard
        label="Alert level"
        value={latestAlert.timestampIso ? latestAlert.alertLevelLabel : "—"}
        tone={alertTone}
      />
      <FireMiniCard
        label="Wind gusts"
        value={latestAlert.timestampIso ? `${latestAlert.windMph} mph` : "—"}
        tone={windTone}
      />
      <FireMiniCard
        label="Humidity"
        value={latestAlert.timestampIso ? `${latestAlert.humidityPct}%` : "—"}
        tone={humidityTone}
      />
    </div>
  );
}
