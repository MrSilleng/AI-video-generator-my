export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
}

export const galleryImages: GalleryImage[] = [
  {
    id: 1,
    src: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/A._J._Jefferies_-_Super_City_%282023%29.jpg',
    alt: 'A sprawling, futuristic city at night with towering skyscrapers and flying vehicles.',
  },
  {
    id: 2,
    src: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Hubble_repair_mission_2_spacewalk.jpg',
    alt: 'An astronaut performing a spacewalk with the Earth visible in the background.',
  },
  {
    id: 3,
    src: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/The_Great_Day_of_His_Wrath_by_John_Martin_1853.jpg',
    alt: 'A dramatic and chaotic fantasy landscape with crumbling mountains under a red sky.',
  },
  {
    id: 4,
    src: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Lange_%26_S%C3%B6hne_Datograph_movement.jpg',
    alt: 'A detailed macro view of the intricate gears and jewels of a luxury watch movement.',
  },
  {
    id: 5,
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Wassily_Kandinsky%2C_1913_-_Composition_7.jpg/1280px-Wassily_Kandinsky%2C_1913_-_Composition_7.jpg',
    alt: "Wassily Kandinsky's 'Composition 7', a vibrant and complex abstract painting.",
  },
  {
    id: 6,
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Black_sea_-_panoramio.jpg/1280px-Black_sea_-_panoramio.jpg',
    alt: 'An underwater scene with sunlight filtering through the water to a rocky seabed.',
  },
];