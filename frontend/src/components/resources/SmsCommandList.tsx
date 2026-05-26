import { statToneClasses } from "@/lib/semanticStyles";

const commands: { cmd: string; label: string }[] = [
  { cmd: "PREP", label: "Get a go-bag checklist" },
  { cmd: "DONE 1", label: "Complete a prep task" },
  { cmd: "SHELTER", label: "Find shelter info" },
  { cmd: "PETS", label: "Pet shelter guidance" },
  { cmd: "RIDE", label: "Request evacuation transport" },
  { cmd: "SAFE", label: "Mark household safe" },
  { cmd: "VOLUNTEER", label: "Offer help" },
  { cmd: "HELP", label: "See all commands" },
];

export function SmsCommandList() {
  const shell = statToneClasses.info;

  return (
    <div className={`rounded-2xl p-5 sm:p-6 ${shell}`}>
      <p className="text-sm font-semibold text-[var(--foreground)]">
        Text these keywords to your FireLink number:
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3">
        {commands.map(({ cmd, label }) => (
          <div
            key={cmd}
            className="flex flex-col gap-0.5 rounded-xl border border-blue-200/80 bg-white/70 px-3 py-2.5 dark:border-blue-800/50 dark:bg-slate-900/40"
          >
            <dt>
              <span className="font-mono text-sm font-bold uppercase tracking-wide text-[var(--foreground)]">
                {cmd}
              </span>
            </dt>
            <dd className="text-sm leading-snug text-[var(--muted-foreground)]">{label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
