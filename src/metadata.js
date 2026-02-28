export function buildMetadata({ title, artist, coverUri, audioUri, description, coverMime, audioMime }) {
  return {
    name: title,
    artist,
    description,
    image: coverUri,
    animation_url: audioUri,
    properties: {
      coverMime,
      audioMime
    },
    uploadedAt: new Date().toISOString()
  };
}
