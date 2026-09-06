/**
 * adminConfig.model.ts — Mongoose model for admin-configurable runtime settings.
 *
 * Stores key/value config pairs. Used for ranking weights, rate limit overrides,
 * and feature flag state — all changeable without a code deploy.
 */
import { Schema, model, type Document, type Model } from 'mongoose';

// ─── Default ranking weights (never hardcoded in business logic) ───────────

export interface RankingWeights {
  /** Experience similarity — post categories match user's categoryInterests */
  w1_similarity:      number;
  /** Recency — time-decay half-life in hours */
  w2_recency:         number;
  /** Meaningful response quality — ratio of meaningful reactions */
  w3_quality:         number;
  /** Diversity signal — boost underrepresented categories */
  w4_diversity:       number;
  /** Safety confidence — penalise flagged posts */
  w5_safety:          number;
  /** Decay half-life in hours (used in recency score) */
  decayHalfLifeHours: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  w1_similarity:      0.30,
  w2_recency:         0.25,
  w3_quality:         0.25,
  w4_diversity:       0.10,
  w5_safety:          0.10,
  decayHalfLifeHours: 24,
};

// ─── Document interface ───────────────────────────────────────────────────────

export interface IAdminConfig extends Document {
  key:       string;
  value:     unknown;
  updatedBy: string | null;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const AdminConfigSchema = new Schema<IAdminConfig>(
  {
    key:       { type: String, required: true, unique: true, index: true },
    value:     { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true }
);

export const AdminConfigModel: Model<IAdminConfig> = model<IAdminConfig>(
  'AdminConfig',
  AdminConfigSchema
);
