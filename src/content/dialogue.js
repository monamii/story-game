import { StoryFlag } from "../core/StoryFlags.js";

export const hikarigumoDialogue = {
  intro: {
    lines: [
      "Bakezaru: Ah, today is so sunny and beautiful.",
      "Bakezaru: Let's go to the beach for a walk.",
    ],
  },
  greeting: {
    lines: ["..."],
    next: "questions",
  },

  questions: {
    menu: [
      {
        label: "Who are you?",
        answer: "Hikarigumo: Hi there, I am Hikarigumo. I am cloud people.",
      },
      {
        label: "Where did you come from?",
        answer:
          "Hikarigumo: I fell from up there, past the clouds. There is a town up there — that is where I am from. I was looking over the edge and then... I need to find a way back.",
      },
      {
        label: "Goodbye.",
        next: "goodbye",
      },
    ],
  },
  goodbye: {
    lines: [
      "Hikarigumo: Ah...",
      "Hikarigumo: My knee. I hurt it when I landed.",
      "Hikarigumo: I have a bandaid in my bag...",
      "Hikarigumo: ...Wait. Where is my bag?",
      "Hikarigumo: I had it when I fell. It must be somewhere on the beach.",
      "Bakezaru: I will find it.",
    ],
    setFlags: [StoryFlag.BAG_QUEST_STARTED],
  },

  bagNotFound: {
    lines: [
      "Hikarigumo: Did you find my bag?",
      "Hikarigumo: My knee really hurts...",
    ],
  },
  bagFound: {
    lines: [
      "Hikarigumo: That is it! That is my bag!",
      "Hikarigumo: Thank you, Bakezaru.",
      "Hikarigumo: ...",
      "Hikarigumo: Bandaid on. There.",
      "Hikarigumo: Good as new.",
      "Hikarigumo: ...I feel so tired. I do not even have anywhere to go.",
      "Bakezaru: Then stay at my place. Just for tonight.",
      "Hikarigumo: ...Are you sure?",
      "Bakezaru: My house is just this way. Come.",
    ],
    setFlags: [StoryFlag.BECAME_COMPANIONS],
  },
  atHome: {
    lines: ["Hikarigumo: ...So this is your house.", "Bakezaru: Yes. Come in."],
    setFlags: [StoryFlag.ARRIVED_HOME],
  },
};

export function selectHikarigumoNode(flags, inventory) {
  if (
    flags.has(StoryFlag.BAG_QUEST_STARTED) &&
    !flags.has(StoryFlag.BECAME_COMPANIONS)
  ) {
    return inventory.has("bag") ? "bagFound" : "bagNotFound";
  }
  return "greeting";
}
