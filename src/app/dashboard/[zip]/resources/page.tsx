import { EmergencyActionCard } from "@/components/resources/EmergencyActionCard";
import {
  IconBackpack,
  IconBolt,
  IconCar,
  IconCheck,
  IconFamily,
  IconGlobe,
  IconHands,
  IconHome,
  IconKnock,
  IconMap,
  IconPhone,
  IconPets,
  IconWater,
} from "@/components/resources/icons";
import { NearbyResourceCard } from "@/components/resources/NearbyResourceCard";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { SafetyDisclaimer } from "@/components/resources/SafetyDisclaimer";
import { SmsCommandList } from "@/components/resources/SmsCommandList";
import type { Metadata } from "next";

type Props = Readonly<{
  params: Promise<{ zip: string }>;
}>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zip } = await params;
  return {
    title: `FireLink — Resources · ${zip}`,
    description: "Emergency help, shelters, SMS tools, and community support.",
  };
}

function SectionHeading({
  eyebrow,
  title,
  id,
}: {
  eyebrow: string;
  title: string;
  id: string;
}) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        {eyebrow}
      </p>
      <h2 id={id} className="text-lg font-bold tracking-tight text-[var(--foreground)] sm:text-xl">
        {title}
      </h2>
    </div>
  );
}

export default async function DashboardResourcesPage({ params }: Props) {
  await params;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
          Available Resources
        </h1>
        <p className="max-w-prose text-sm leading-snug text-[var(--muted-foreground)]">
          Fast access to emergency help, shelters, SMS tools, and community support.
        </p>
        <p className="text-xs font-semibold text-red-700 dark:text-red-400">
          For life-threatening emergencies, call 911.
        </p>
      </header>

      <section aria-labelledby="get-help-heading">
        <SectionHeading eyebrow="Immediate actions" title="Get Help Now" id="get-help-heading" />
        <ul className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
          <li>
            <EmergencyActionCard
              tone="urgent"
              icon={<IconPhone className="size-7 shrink-0 text-red-800 sm:size-8 dark:text-red-200" />}
              title="Call emergency hotline"
              description="Evacuation orders, shelters, urgent local guidance."
              actionLabel="Call 2-1-1"
              href="tel:211"
            />
          </li>
          <li>
            <EmergencyActionCard
              tone="info"
              icon={<IconHome className="size-7 sm:size-8 text-blue-800 dark:text-blue-200" />}
              title="Find shelter"
              description="Public shelters, pet-friendly shelters, and cooling centers."
              actionLabel="View shelters"
              href="#near-you"
            />
          </li>
          <li>
            <EmergencyActionCard
              tone="warning"
              icon={<IconCar className="size-7 sm:size-8 text-orange-900 dark:text-orange-200" />}
              title="Request evacuation ride"
              description="Mark your household as needing transportation support."
              actionLabel="Text RIDE"
            />
          </li>
        </ul>
      </section>

      <section aria-labelledby="critical-heading">
        <SectionHeading eyebrow="Essential" title="Critical Resources" id="critical-heading" />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <li>
            <ResourceCard
              tone="info"
              icon={<IconHome className="size-5 text-blue-700 dark:text-blue-400" />}
              title="Shelter info"
              description="Find public shelters and availability by ZIP."
              actionLabel="Text SHELTER"
            />
          </li>
          <li>
            <ResourceCard
              tone="info"
              icon={<IconPets className="size-5 text-blue-700 dark:text-blue-400" />}
              title="Pet-friendly shelter lookup"
              description="Find co-sheltering or animal service options."
              actionLabel="Text PETS"
            />
          </li>
          <li>
            <ResourceCard
              tone="warning"
              icon={<IconBolt className="size-5 text-orange-700 dark:text-orange-400" />}
              title="Medical device power support"
              description="Battery support or charging locations for medical devices."
              actionLabel="Text POWER"
            />
          </li>
          <li>
            <ResourceCard
              tone="urgent"
              icon={<IconWater className="size-5 text-red-700 dark:text-red-400" />}
              title="Water safety updates"
              description="Check drinking water advisories and bottled water guidance."
              actionLabel="View updates"
            />
          </li>
        </ul>
      </section>

      <section id="near-you" aria-labelledby="near-heading">
        <SectionHeading eyebrow="Location-aware (demo)" title="Near You" id="near-heading" />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <li>
            <NearbyResourceCard
              icon={<IconHome className="size-5 text-green-700 dark:text-green-400" />}
              name="Community Shelter"
              distance="2.1 mi"
              status="open"
              notes="General population shelter"
            />
          </li>
          <li>
            <NearbyResourceCard
              icon={<IconPets className="size-5 text-orange-700 dark:text-orange-400" />}
              name="Pet-Friendly Shelter"
              distance="3.4 mi"
              status="limited"
              notes="Pets accepted with carriers"
            />
          </li>
          <li>
            <NearbyResourceCard
              icon={<IconBolt className="size-5 text-green-700 dark:text-green-400" />}
              name="Charging Center"
              distance="1.8 mi"
              status="open"
              notes="Medical device charging available"
            />
          </li>
          <li>
            <NearbyResourceCard
              icon={<IconMap className="size-5 text-green-700 dark:text-green-400" />}
              name="Cooling / Clean Air Center"
              distance="2.7 mi"
              status="open"
              notes="Indoor air relief and cooling"
            />
          </li>
        </ul>
      </section>

      <section aria-labelledby="community-heading">
        <SectionHeading eyebrow="Together" title="Community Support" id="community-heading" />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <li>
            <ResourceCard
              tone="urgent"
              icon={<IconCar className="size-5 text-red-700 dark:text-red-400" />}
              title="Need a ride?"
              description="Request evacuation transportation support."
              actionLabel="Text RIDE"
            />
          </li>
          <li>
            <ResourceCard
              tone="safe"
              icon={<IconHands className="size-5 text-green-700 dark:text-green-400" />}
              title="Can help others?"
              description="Volunteer transportation, supplies, or wellness checks."
              actionLabel="Text VOLUNTEER"
            />
          </li>
          <li>
            <ResourceCard
              tone="safe"
              icon={<IconCheck className="size-5 text-green-700 dark:text-green-400" />}
              title="Mark safe"
              description="Let the community dashboard know your household is safe."
              actionLabel="Text SAFE"
            />
          </li>
          <li>
            <ResourceCard
              tone="info"
              icon={<IconKnock className="size-5 text-blue-700 dark:text-blue-400" />}
              title="Wellness check"
              description="Anonymous neighborhood check-ins — no names or numbers shared."
              actionLabel="Text CHECK"
            />
          </li>
        </ul>
      </section>

      <section aria-labelledby="sms-heading">
        <SectionHeading eyebrow="Quick reference" title="Use FireLink by SMS" id="sms-heading" />
        <SmsCommandList />
      </section>

      <section aria-labelledby="prep-heading">
        <SectionHeading eyebrow="Plan ahead" title="Prep & Safety" id="prep-heading" />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <li>
            <ResourceCard
              tone="warning"
              icon={<IconBackpack className="size-5 text-orange-700 dark:text-orange-400" />}
              title="Go-bag checklist"
              description="Get a short checklist and track progress."
              actionLabel="Text PREP"
            />
          </li>
          <li>
            <ResourceCard
              tone="warning"
              icon={<IconBolt className="size-5 text-orange-700 dark:text-orange-400" />}
              title="Medical device backup"
              description="Plan battery, charging, and backup power needs."
              actionLabel="Text POWER"
            />
          </li>
          <li>
            <ResourceCard
              tone="info"
              icon={<IconFamily className="size-5 text-blue-700 dark:text-blue-400" />}
              title="Family contact plan"
              description="Decide where to meet and who to contact."
              actionLabel="View guide"
            />
          </li>
          <li>
            <ResourceCard
              tone="info"
              icon={<IconGlobe className="size-5 text-blue-700 dark:text-blue-400" />}
              title="Multi-language alert digest"
              description="Emergency guidance in supported languages."
              actionLabel="Text ESPAÑOL or HELP"
            />
          </li>
        </ul>
      </section>

      <SafetyDisclaimer />
    </div>
  );
}
