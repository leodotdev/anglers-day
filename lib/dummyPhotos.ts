// Fishing charter photos from Unsplash for development
// Curated for quality: sport fishing, nice charter boats, tropical water, action shots

const photos = [
  // Sport fishing & luxury charter boats
  "https://images.unsplash.com/photo-1604915666686-93382bae0c16?w=800&q=80",
  "https://images.unsplash.com/photo-1584772126711-017fae29eadd?w=800&q=80",
  "https://images.unsplash.com/photo-1606921918777-c43cbcc3d11f?w=800&q=80",
  "https://images.unsplash.com/photo-1604914992542-5e0319ad6528?w=800&q=80",
  "https://images.unsplash.com/photo-1681026143189-cc780f4c7939?w=800&q=80",
  // Tropical water & fishing boats
  "https://images.unsplash.com/photo-1575224639406-b218af1ee31e?w=800&q=80",
  "https://images.unsplash.com/photo-1597799119438-cbf326f268b9?w=800&q=80",
  "https://images.unsplash.com/photo-1618578907040-e8e81b085dfb?w=800&q=80",
  "https://images.unsplash.com/photo-1575224639551-12afa3e701d9?w=800&q=80",
  "https://images.unsplash.com/photo-1484506662025-7e5929e7cf00?w=800&q=80",
  // Ocean & fishing action
  "https://images.unsplash.com/photo-1665617243871-8da6d47451b2?w=800&q=80",
  "https://images.unsplash.com/photo-1663036111057-b2fb47dcda96?w=800&q=80",
  "https://images.unsplash.com/photo-1637407411845-fbfaa0d08923?w=800&q=80",
  "https://images.unsplash.com/photo-1655105492202-73cf816ab62c?w=800&q=80",
  "https://images.unsplash.com/photo-1650065451260-503fde7f00f7?w=800&q=80",
  "https://images.unsplash.com/photo-1612893964995-b2c9f1ce919f?w=800&q=80",
  "https://images.unsplash.com/photo-1574101102896-f9446194d738?w=800&q=80",
  "https://images.unsplash.com/photo-1637407414183-a2080a848946?w=800&q=80",
  // Keep some good originals
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
  "https://images.unsplash.com/photo-1635883069995-62b9d2147a72?w=800&q=80",
  "https://images.unsplash.com/photo-1685399906145-fe59868f8080?w=800&q=80",
  "https://images.unsplash.com/photo-1619054976487-7198b8924922?w=800&q=80",
  "https://images.unsplash.com/photo-1547760672-eb6a6d7b5925?w=800&q=80",
  "https://images.unsplash.com/photo-1628430421614-744635cb24f1?w=800&q=80",
  "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800&q=80",
  "https://images.unsplash.com/photo-1601498052034-3c265991f662?w=800&q=80",
  "https://images.unsplash.com/photo-1651973972237-c7dec80f9649?w=800&q=80",
  "https://images.unsplash.com/photo-1618458578505-c1b981981806?w=800&q=80",
];

/**
 * Get a deterministic set of photo URLs for a listing based on its ID.
 * Returns 3-5 photos per listing so each has a carousel.
 */
export function getListingPhotos(listingId: string): string[] {
  let hash = 0;
  for (let i = 0; i < listingId.length; i++) {
    hash = ((hash << 5) - hash + listingId.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(hash);
  const count = 3 + (seed % 3); // 3-5 photos
  const start = seed % photos.length;

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(photos[(start + i * 7) % photos.length]);
  }
  return result;
}
