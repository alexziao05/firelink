import type { FireConditionsViewModel } from "@/lib/fireConditionsAdapter";
import { lastReportedGrowthDelta } from "@/lib/fireConditionsAdapter";
import { LiveEatonMap } from "@/components/LiveEatonMap";
import { AlertTimeline } from "./AlertTimeline";
import { FireGrowthChart } from "./FireGrowthChart";
import { FireStatusCards } from "./FireStatusCards";
import { FirePastUpdates } from "./FirePastUpdates";
import { LatestFireUpdate } from "./LatestFireUpdate";

type Props = {
  data: FireConditionsViewModel;
  /** When false, hide duplicate H2 (e.g. Fire tab page provides its own title). */
  showHeading?: boolean;
  id?: string;
};

export function FireConditionsSection({
  data,
  showHeading = true,
  id = "fire-conditions-heading",
}: Props) {
  const growthDelta = lastReportedGrowthDelta(data.growthSeries);

  const latestFireWeather =
    data.latestAlert.timestampIso !== ""
      ? {
          tier: data.latestAlert.tier,
          event: data.latestAlert.event,
          timestampIso: data.latestAlert.timestampIso,
          severity: data.latestAlert.severity,
          alertLevelLabel: data.latestAlert.alertLevelLabel,
          windMph: data.latestAlert.windMph,
          humidityPct: data.latestAlert.humidityPct,
          area: data.latestAlert.area,
          description: data.latestAlert.description,
        }
      : null;

  return (
    <section
      className="mb-8 scroll-mt-28"
      aria-labelledby={showHeading ? id : undefined}
      aria-label={showHeading ? undefined : "Fire conditions"}
      id="fire-conditions"
    >
      {showHeading ? (
        <h2 id={id} className="mb-4 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Fire Conditions
        </h2>
      ) : null}

      <div className="space-y-6">
        <LiveEatonMap />

        <FireStatusCards data={data} />

        <FireGrowthChart series={data.growthSeries} />

        <div className="flex flex-col gap-6">
          <AlertTimeline items={data.alertTimeline} />

          <LatestFireUpdate
            fireName={data.latestIncident.name}
            status={data.latestIncident.status}
            timestampIso={data.latestIncident.timestampIso}
            acres={data.latestIncident.acres}
            containmentPct={data.latestIncident.containmentPct}
            growthDelta={growthDelta}
            alert={latestFireWeather}
          />

          <FirePastUpdates items={data.pastIncidentUpdates} />
        </div>
      </div>
    </section>
  );
}
