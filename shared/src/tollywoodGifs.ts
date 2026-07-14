export interface TollywoodGif {
  id: string;
  label: string;
  gifUrl: string;
}

/**
 * Curated Telugu / Tollywood reaction GIFs from Tenor.
 * Source search: https://tenor.com/search/telugu-gifs
 * Chat accepts only these ids.
 */
export const TOLLYWOOD_GIFS: TollywoodGif[] = [
  {
    id: "chala-unfortunate",
    label: "Chala unfortunate",
    gifUrl: "https://media.tenor.com/AQe2wXY_H0UAAAAM/djtillu-thokkathotakura.gif",
  },
  {
    id: "bandla-ganesh",
    label: "Bandla Ganesh",
    gifUrl: "https://media.tenor.com/w6A-Kfg5VdcAAAAM/bandla-ganesh-telugu-memes.gif",
  },
  {
    id: "brahmi-funny",
    label: "Brahmi funny",
    gifUrl: "https://media.tenor.com/AJBz6sd0CHsAAAAM/brahmi-telugu.gif",
  },
  {
    id: "brahmanandam-show",
    label: "Brahmanandam",
    gifUrl: "https://media.tenor.com/7096zGiLS3MAAAAM/brahmanamdam-telugu-comedy.gif",
  },
  {
    id: "bhibatsam",
    label: "Bhibatsam",
    gifUrl: "https://media.tenor.com/Pf6-bfWCUr4AAAAM/bhibatsam-brahmanandam.gif",
  },
  {
    id: "chiru",
    label: "Chiranjeevi",
    gifUrl: "https://media.tenor.com/2f9BSjDeECQAAAAM/chiranjeevi-chiru.gif",
  },
  {
    id: "balayya-thumbs",
    label: "Balayya thumbs up",
    gifUrl: "https://media.tenor.com/50bmez8HhJIAAAAM/telugu-balayya.gif",
  },
  {
    id: "raviteja",
    label: "Ravi Teja",
    gifUrl: "https://media.tenor.com/rxbNbSEUgpYAAAAM/raviteja-heroes.gif",
  },
  {
    id: "nani-sundaraniki",
    label: "Nani",
    gifUrl: "https://media.tenor.com/DH-AfUl83_EAAAAM/ante-sundaraniki-nani.gif",
  },
  {
    id: "venky-f3",
    label: "Venkatesh F3",
    gifUrl: "https://media.tenor.com/S4yNmMtkcxYAAAAM/venkatesh-f3.gif",
  },
  {
    id: "pichukka",
    label: "Pichukka",
    gifUrl: "https://media.tenor.com/ZkWAxucqDA0AAAAM/pichukka-pichuka.gif",
  },
  {
    id: "same-to-same",
    label: "Same to same",
    gifUrl: "https://media.tenor.com/8cTIblAGRc4AAAAM/thokkathotakura-thokkath0takura.gif",
  },
  {
    id: "ali-kick",
    label: "Ali comedy",
    gifUrl: "https://media.tenor.com/jDoDPvOtXWUAAAAM/ali-comedy-kick-telugu.gif",
  },
  {
    id: "sarcastic-laugh",
    label: "Sarcastic laugh",
    gifUrl: "https://media.tenor.com/jpiIR40JzTkAAAAM/sarcastic-laugh.gif",
  },
  {
    id: "telugu-funny",
    label: "Telugu funny",
    gifUrl: "https://media.tenor.com/XflHGQI6IrkAAAAM/telugu-funny.gif",
  },
  {
    id: "jabardasth",
    label: "Jabardasth",
    gifUrl: "https://media.tenor.com/GlY9nQHBy_MAAAAM/telugu-jabardasth.gif",
  },
  {
    id: "shivaji-meme",
    label: "Shivaji meme",
    gifUrl: "https://media.tenor.com/X2E_gEWSGA0AAAAM/shivaji-meme-shivaji-telugu-meme.gif",
  },
  {
    id: "brahmi-scarf",
    label: "Brahmi reaction",
    gifUrl: "https://media.tenor.com/3uuFIBhvOa8AAAAM/telugu-brahmi.gif",
  },
  {
    id: "angry-brahmi",
    label: "Angry face",
    gifUrl: "https://media.tenor.com/etqABDUjiy8AAAAM/brahmanandam-angry.gif",
  },
  {
    id: "smart-child",
    label: "Smart child",
    gifUrl: "https://media.tenor.com/JHz8QnkUxooAAAAM/smart-chilipi.gif",
  },
  {
    id: "nuvvu-jagratha",
    label: "Nuvvu jagratha",
    gifUrl: "https://media.tenor.com/cJQr-717fqYAAAAM/uma-maheswara-ugra-roopasya-maha-venkatesh.gif",
  },
  {
    id: "mass-highfive",
    label: "Mass high five",
    gifUrl: "https://media.tenor.com/jesKA-SCRaAAAAAM/telugu-mass-telugu-high-five.gif",
  },
  {
    id: "chi-pora",
    label: "Chi pora",
    gifUrl: "https://media.tenor.com/SJ40vOPxii8AAAAM/chi-pora-telugu-memes.gif",
  },
  {
    id: "telugu-oops",
    label: "Oops",
    gifUrl: "https://media.tenor.com/4t1Bm63EkkYAAAAM/telugu-funny.gif",
  },
  {
    id: "smile-telugu",
    label: "Smile",
    gifUrl: "https://media.tenor.com/QF8hBrGiJj0AAAAM/smile-telugu.gif",
  },
];

export const TOLLYWOOD_GIF_IDS = new Set(TOLLYWOOD_GIFS.map((g) => g.id));

export function getGifById(id: string): TollywoodGif | undefined {
  return TOLLYWOOD_GIFS.find((g) => g.id === id);
}
