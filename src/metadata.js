export function buildMetadata({ title, artist, coverUri, audioUri, description }) {
  return {
    name: title,
    artist,
    description,
    image: coverUri,
    animation_url: audioUri,
    uploadedAt: new Date().toISOString()
  };
}
