export const StoryFlag = Object.freeze({
  BAG_QUEST_STARTED: "bag_quest_started",
  BECAME_COMPANIONS: "became_companions",
});

export class StoryFlags {
  #flags = new Set();

  set(flag) {
    this.#flags.add(flag);
  }
  has(flag) {
    return this.#flags.has(flag);
  }
}
