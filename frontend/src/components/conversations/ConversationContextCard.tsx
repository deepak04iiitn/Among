/**
 * ConversationContextCard.tsx — Shown when matched but no messages yet.
 * Displays the shared experience context and opening prompt suggestions.
 *
 * Design: editorial, intimate. The connection reason is the most prominent element.
 */
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';

// ─── Opening prompt suggestions by category cluster ───────────────────────────
// These are prompts, not scripts — they're suggestions to reduce blank-page anxiety.
const OPENING_PROMPTS_BY_CATEGORY: Record<string, string[]> = {
  default: [
    'What made you reach out today?',
    'How long have you been sitting with this?',
    'Is there something specific on your mind right now?',
  ],
  loneliness: [
    'What does the loneliness feel like for you lately?',
    'Is there a particular time of day that feels hardest?',
    'Have you been able to talk to anyone about this?',
  ],
  grief: [
    'How long ago did things change for you?',
    'Is there something you wish people understood better?',
    'What has been most surprising about this experience?',
  ],
  work: [
    'What part of the work situation feels most stuck right now?',
    'Has this affected things outside of work too?',
    'What would "better" look like to you?',
  ],
  relationships: [
    'How long has this been going on?',
    'What does the relationship feel like right now?',
    'Is there something you haven\'t been able to say to them?',
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationContextCardProps {
  contextCategoryId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConversationContextCard({
  contextCategoryId,
}: ConversationContextCardProps): React.JSX.Element {
  const category = EXPERIENCE_CATEGORIES.find((c) => c.id === contextCategoryId);
  const prompts  = OPENING_PROMPTS_BY_CATEGORY[contextCategoryId] ?? OPENING_PROMPTS_BY_CATEGORY['default'] ?? [];

  return (
    <div className="border-b border-[var(--color-border)] pb-6 mb-6">
      <p className="text-caption text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
        You are connected because both of you chose
      </p>
      <p className="font-editorial text-title text-[var(--color-text)] mb-4">
        {category?.displayName ?? contextCategoryId}
      </p>

      {prompts.length > 0 && (
        <div className="space-y-1">
          <p className="text-caption text-[var(--color-text-muted)] mb-2">
            Some opening thoughts, if helpful:
          </p>
          <ul className="space-y-1" aria-label="Conversation starter suggestions">
            {prompts.map((prompt, i) => (
              <li key={i} className="text-body text-[var(--color-text-muted)] italic pl-3 border-l border-[var(--color-border)]">
                {prompt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
