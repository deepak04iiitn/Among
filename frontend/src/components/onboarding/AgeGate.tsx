/**
 * AgeGate.tsx — Age confirmation checkbox required before account creation.
 *
 * Design: Simple typographic checkbox. No modal, no interruption.
 * The user must check the box to proceed — unchecked state is visible
 * without being aggressive or alarmist.
 */
'use client';

interface AgeGateProps {
  readonly confirmed: boolean;
  readonly onChange:  (confirmed: boolean) => void;
}

export default function AgeGate({ confirmed, onChange }: AgeGateProps) {
  return (
    <label
      className="flex items-start gap-3 cursor-pointer group"
      htmlFor="age-confirmation"
    >
      <span className="mt-0.5 flex-shrink-0">
        <input
          id="age-confirmation"
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onChange(e.target.checked)}
          className={[
            'w-4 h-4 rounded border cursor-pointer',
            'accent-accent',
            confirmed ? 'border-accent' : 'border-border',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          ].join(' ')}
          aria-required="true"
          aria-checked={confirmed}
        />
      </span>
      <span className="text-ui text-text-secondary group-hover:text-text transition-colors">
        I confirm I am 16 years of age or older and understand that this
        platform discusses real human experiences, including difficult ones.
      </span>
    </label>
  );
}
