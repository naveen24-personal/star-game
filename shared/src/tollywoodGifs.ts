export interface TollywoodGif {
  id: string;
  label: string;
  gifUrl: string;
}

/**
 * Curated Tollywood / Telugu cinema reaction GIFs (public Giphy CDN URLs).
 * Chat accepts only these ids.
 */
export const TOLLYWOOD_GIFS: TollywoodGif[] = [
  {
    id: "rrr-dance",
    label: "RRR dance energy",
    gifUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWFzcy1lbnRyeS1ycnIvZGFuY2U/3o7aCTPPm4OHfRLSH6/giphy.gif",
  },
  {
    id: "baahubali-roar",
    label: "Baahubali roar",
    gifUrl: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  },
  {
    id: "pushpa-entry",
    label: "Pushpa mass entry",
    gifUrl: "https://media.giphy.com/media/JIX9t2j0vTN4H/giphy.gif",
  },
  {
    id: "salaar-stare",
    label: "Intense stare",
    gifUrl: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  },
  {
    id: "kgf-fire",
    label: "Fire vibes",
    gifUrl: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif",
  },
  {
    id: "laugh-hard",
    label: "Lol laugh",
    gifUrl: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif",
  },
  {
    id: "clap",
    label: "Clap clap",
    gifUrl: "https://media.giphy.com/media/7rj2ZgttXzTS/giphy.gif",
  },
  {
    id: "shock",
    label: "Shock face",
    gifUrl: "https://media.giphy.com/media/bC9czlgCMtw4cjoxFP/giphy.gif",
  },
  {
    id: "mind-blown",
    label: "Mind blown",
    gifUrl: "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
  },
  {
    id: "thumbs-up",
    label: "Thumbs up",
    gifUrl: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  },
  {
    id: "facepalm",
    label: "Facepalm",
    gifUrl: "https://media.giphy.com/media/8L0Pky6C4lqq0/giphy.gif",
  },
  {
    id: "dance-party",
    label: "Celebration dance",
    gifUrl: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  },
  {
    id: "slow-clap",
    label: "Slow clap",
    gifUrl: "https://media.giphy.com/media/l0ExncehJzZWlCmNG/giphy.gif",
  },
  {
    id: "yes",
    label: "Yes!",
    gifUrl: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  },
  {
    id: "nope",
    label: "Nope",
    gifUrl: "https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif",
  },
  {
    id: "thinking",
    label: "Thinking",
    gifUrl: "https://media.giphy.com/media/3o7bu3XilJ5BOiSGpc/giphy.gif",
  },
  {
    id: "victory",
    label: "Victory roar",
    gifUrl: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  },
  {
    id: "suspense",
    label: "Suspense",
    gifUrl: "https://media.giphy.com/media/xT0GqssROkJgYWn6x2/giphy.gif",
  },
  {
    id: "hype",
    label: "Hype",
    gifUrl: "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif",
  },
  {
    id: "crying-laugh",
    label: "Crying laughing",
    gifUrl: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif",
  },
  {
    id: "boss",
    label: "Boss energy",
    gifUrl: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
  },
  {
    id: "wow",
    label: "Wow",
    gifUrl: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  },
  {
    id: "sad",
    label: "Sad",
    gifUrl: "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
  },
  {
    id: "angry",
    label: "Angry",
    gifUrl: "https://media.giphy.com/media/l1J9u3TZfpmeDLkD6/giphy.gif",
  },
  {
    id: "cool",
    label: "Cool",
    gifUrl: "https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif",
  },
];

export const TOLLYWOOD_GIF_IDS = new Set(TOLLYWOOD_GIFS.map((g) => g.id));

export function getGifById(id: string): TollywoodGif | undefined {
  return TOLLYWOOD_GIFS.find((g) => g.id === id);
}
