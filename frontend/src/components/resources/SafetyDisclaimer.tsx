import { statToneClasses } from "@/lib/semanticStyles";
import { IconInfo } from "./icons";

export function SafetyDisclaimer() {
  const shell = statToneClasses.warning;

  return (
    <aside
      className={`rounded-2xl p-5 sm:p-6 ${shell}`}
      aria-labelledby="safety-disclaimer-heading"
    >
      <div className="flex gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200 [&_svg]:size-5"
          aria-hidden
        >
          <IconInfo />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            id="safety-disclaimer-heading"
            className="text-base font-bold text-[var(--foreground)] sm:text-lg"
          >
            Important Safety Note
          </h3>
          <p className="mt-2 text-sm leading-snug text-[var(--muted-foreground)]">
            Map data and community reports may lag official evacuation orders. Follow instructions from
            local emergency officials. If you are in immediate danger, call 911.
          </p>
        </div>
      </div>
    </aside>
  );
}
