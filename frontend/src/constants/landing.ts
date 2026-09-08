/**
 * Public landing page copy — frontend only.
 * Never inline these strings in components.
 */
import { ROUTES } from './routes';
import {
  CONVERSATION_INACTIVITY_EXPIRY_MS,
  CONVERSATION_MAX_DURATION_MS,
} from './timeouts';

const CONVERSATION_MAX_HOURS = CONVERSATION_MAX_DURATION_MS / (60 * 60 * 1000);
const CONVERSATION_INACTIVITY_MINUTES = CONVERSATION_INACTIVITY_EXPIRY_MS / (60 * 1000);

export const LANDING = {
  HERO_KICKER: 'An anonymous human-experience network',
  HERO_TITLE: "You're not the only one.",
  HERO_WORDS: ["You're", 'not', 'the', 'only', 'one.'] as const,
  HERO_LEDE:
    'A private, anonymous place to share lived experiences and find people who have already lived them — loneliness, work, family, love, and the things you cannot say anywhere else.',
  CTA_PRIMARY: 'Enter Among →',
  CTA_PRIMARY_ARIA: 'Create an AMONG account and begin',
  CTA_SECONDARY: 'Browse experiences',
  CTA_SECONDARY_ARIA: 'Browse anonymous lived experiences',
  HERO_REGION: 'Welcome to AMONG',

  MANIFESTO_KICKER: 'What this is',
  MANIFESTO_HEADING: 'A quiet room for what you actually live.',
  MANIFESTO_PULL:
    'The question AMONG exists to answer is simple: who else has lived what I am living?',
  MANIFESTO_PARAGRAPHS: [
    'AMONG is an anonymous community for shared lived experiences. Not a social network. Not a confession dump. Not a place to collect followers or become a voice. It is a network organized around the things humans go through — so you can say them, and so someone who has been there can find you.',
    'You are represented by a temporary alias and an abstract mark. Other people never see your name, email, or account. There are no public profiles, no reputation scores, and no “who reacted” lists. The words are the surface.',
    'Relatability matters more than popularity here. A quiet experience is not ranked beneath a loud one. Conversations are temporary on purpose. You meet in the middle of something real, and then the room closes.',
  ],
  MANIFESTO_ABOUT: 'Read the full story of AMONG →',
  MANIFESTO_REGION: 'What AMONG is',

  HOW_KICKER: 'How it works',
  HOW_HEADING: 'Write. Be found. Talk for a while.',
  HOW_LEDE:
    'An anonymous experience network should feel like leaving a letter, not performing a post. Three steps. No streaks. No infinite scroll.',
  HOW_REGION: 'How AMONG works',
  HOW_SAME_MARK: 'SAME',
  HOW_STEPS: [
    {
      cue: 'Write',
      numeral: 'I',
      title: 'Share what you have lived',
      body: 'Write an experience in your own words. Choose the category it belongs to. The platform scans for safety before anything becomes visible — and if crisis language appears, support resources surface immediately.',
      sameMark: false,
    },
    {
      cue: 'Be found',
      numeral: 'II',
      title: 'Find people who have been there',
      body: 'Others mark SAME when your words are theirs too. That is not a like. It is a signal of shared life. Discovery is organized by experience — loneliness, relationships, work, family — not by who is already famous in the room.',
      sameMark: true,
    },
    {
      cue: 'Talk',
      numeral: 'III',
      title: 'Talk. Then it ends.',
      body: `If you both want to, you can start a private conversation. It is anonymous, temporary, and never a follower relationship. Silence of ${CONVERSATION_INACTIVITY_MINUTES} minutes lets it rest. Nothing lasts more than ${CONVERSATION_MAX_HOURS} hours.`,
      sameMark: false,
    },
  ],

  EXPERIENCES_KICKER: 'The contents',
  EXPERIENCES_HEADING: 'Lived experiences people come here with.',
  EXPERIENCES_LEDE:
    'These are not tags for a feed. They are the rooms of the network — each one a public page of anonymous experiences you can read without an account.',
  EXPERIENCES_REGION: 'Experience categories',
  EXPERIENCES_ALL: 'See every experience →',
  EXPERIENCES_ALL_ARIA: 'Explore all anonymous experience categories',

  CONTRAST_KICKER: 'A useful distinction',
  CONTRAST_HEADING: 'What AMONG is not.',
  CONTRAST_INSTEAD: 'Instead of',
  CONTRAST_REGION: 'What AMONG is not',
  CONTRAST_ITEMS: [
    {
      struck: 'a social network',
      label: 'Not a social network',
      body: 'No followers, no public profiles, no personal brand to maintain. Experience over identity.',
    },
    {
      struck: 'a public forum',
      label: 'Not Reddit',
      body: 'Not a general discussion board. Threads do not accumulate status. Ranking is not a popularity contest.',
    },
    {
      struck: 'therapy',
      label: 'Not therapy',
      body: 'AMONG is human-to-human connection around shared life. It is not clinical care, and it does not replace it.',
    },
    {
      struck: 'a performance',
      label: 'Not a performance',
      body: 'No karma, no streaks, no public audience counting your pain. The value is being understood — briefly, honestly.',
    },
  ],

  SAFETY_KICKER: 'Trust',
  SAFETY_HEADING: 'Anonymous to each other. Accountable to the room.',
  SAFETY_REGION: 'Safety and anonymity',
  SAFETY_LEDE:
    'Anonymity without unaccountability is the founding rule. You cannot see who someone is. The platform still can keep the space safe — reports, blocks, and crisis care are built in, not bolted on.',
  SAFETY_POINTS: [
    {
      title: 'Temporary identity',
      body: 'Aliases rotate. A new alias is a new abstract mark. Blocks and safety actions stay with the private account, not the name on the page.',
    },
    {
      title: 'No public trail',
      body: 'There is no “view this person’s posts.” Individual reactions are never shown. Aggregate “you are not alone” counts appear only when the group is large enough to protect privacy.',
    },
    {
      title: 'Care before virality',
      body: 'Crisis resources appear immediately when they are needed. Harmful content can be reported. Conversations expire. You can leave.',
    },
  ],
  SAFETY_GUIDELINES: 'Read the community guidelines →',
  SAFETY_HELP: 'Help and common questions',

  FAQ_KICKER: 'Questions',
  FAQ_HEADING: 'What people ask before they enter.',
  FAQ_REGION: 'Frequently asked questions',
  FAQ_MORE: 'More answers on the help page →',
  FAQ_ITEMS: [
    {
      question: 'What is AMONG?',
      answer:
        'AMONG is an anonymous community for sharing lived experiences and finding people who have been through the same things. It is built around the promise “you’re not the only one” — not around followers, profiles, or public reputation.',
    },
    {
      question: 'Is AMONG truly anonymous?',
      answer:
        'To other people, yes. They see a temporary alias and an abstract avatar — never your name, email, or account. The platform keeps a private account so the space can stay safe. There are no public profile pages and no way to search someone by alias.',
    },
    {
      question: 'Is this a social network or a support forum?',
      answer:
        'Neither, exactly. It is an anonymous human-experience network. You share what you have lived, find relatability rather than popularity, and may have a temporary conversation with someone who has been there. It is not a place to build an audience.',
    },
    {
      question: 'How do conversations work?',
      answer: `Conversations are optional, anonymous, and temporary. They rest after ${CONVERSATION_INACTIVITY_MINUTES} minutes of silence and never continue past ${CONVERSATION_MAX_HOURS} hours. There are no read receipts and no lasting follower relationship when they end.`,
    },
    {
      question: 'Can AMONG replace therapy or crisis care?',
      answer:
        'No. AMONG is for human connection around shared experience. If you are in crisis, dedicated help should come first. When crisis language is detected, AMONG surfaces support resources immediately — it does not wait for a moderator to notice.',
    },
  ],

  CLOSE_HEADING: 'You have been through things no one else knows.',
  CLOSE_LEDE:
    'Someone else is going through them right now. You do not have to perform it. You only have to say it.',
  CLOSE_REGION: 'Begin with AMONG',
} as const;

export const LANDING_LINKS = {
  PRIMARY_CTA: ROUTES.ONBOARDING_INTENT,
  EXPLORE: ROUTES.EXPLORE,
  ABOUT: ROUTES.ABOUT,
  GUIDELINES: ROUTES.GUIDELINES,
  HELP: ROUTES.HELP,
} as const;
