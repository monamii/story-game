import { StoryFlag } from "../core/StoryFlags";

export const hikarigumoDialogue = {
  greeting: {
    lines: ["..."],
    next: "questions",
  },

  questions: {
    menu: [
      {
        label: "Who are you?",
        answer:
          "I am Hikarigumo. I am from the cloud people. We live where the sky turn white and soft. I have never been down here before.",
      },
      {
        label: "Where did you come from?",
        answer:
          "I fell from up there, past the clouds. There is a town up there — that is where I am from. I was looking over the edge and then... I need to find a way back.",
      },
      {
        label: "Goodbye.",
        next: (flags) =>
          flags.has(StoryFlag.BAG_QUEST_STARTED) ? "goodbyeAgain" : "goodbye",
      },
    ],
  },
  goodbye: {
    lines: [
      "Ah...",
      "My knee. I hurt it when I landed.",
      "I have a bandaid in my bag...",
      "...Wait. Where is my bag?",
      "I had it when I fell. It must be somewhere on the beach.",
      "Bakezaru: I will find it.",
    ],
    setFlags: [StoryFlag.BAG_QUEST_STARTED],
  },

  goodbyeAgain: {
    lines: [
      "You are still looking?",
      "Take your time. I am not going anywhere like this.",
    ],
  },
  bagNotFound: {
    lines: ["Did you find my bag?", "My knee really hurts..."],
  },
  bagFound: {
    lines: [
      "That is it! That is my bag!",
      "Thank you, Bakezaru.",
      "...",
      "Bandaid on. There.",
      "Good as new.",
      "Hey... do you want to walk together for a while?",
      "I do not know where I am going. But that is okay.",
    ],
    setFlags: [StoryFlag.BECAME_COMPANIONS],
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
