import { MetadataRoute } from 'next'

const BASE_URL = 'https://www.pebelai.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    // Core pages — highest priority
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Feature pages — for SEO landing
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
