import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicNav } from '@/components/public-nav'
import { getAllPosts, getPostBySlug } from '@/lib/blog-data'

const BASE_URL = 'https://www.pebelai.com'

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  const url = `${BASE_URL}/blog/${post.slug}`

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    authors: [{ name: post.author, url: `${BASE_URL}/about` }],
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      authors: [post.author],
      tags: post.tags,
      images: post.ogImage ? [post.ogImage] : ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const url = `${BASE_URL}/blog/${post.slug}`
  const allPosts = getAllPosts()
  const related = allPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': url,
    headline: post.title,
    description: post.description,
    url,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    inLanguage: 'en-IN',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: {
      '@type': 'Person',
      name: post.author,
      url: `${BASE_URL}/about`,
      jobTitle: post.authorRole,
    },
    publisher: { '@id': `${BASE_URL}/#org` },
    image: post.ogImage ? `${BASE_URL}${post.ogImage}` : `${BASE_URL}/og-image.png`,
    keywords: post.tags.join(', '),
    articleSection: post.category,
    wordCount: post.body.split(/\s+/).length,
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  }

  const faqJsonLd = post.faq && post.faq.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <PublicNav />

      <article className="max-w-3xl mx-auto px-6 py-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-slate-400">
          <Link href="/" className="hover:text-[#0A6A47]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-[#0A6A47]">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-600">{post.category}</span>
        </nav>

        <p className="text-[12px] font-bold tracking-widest text-emerald-700 uppercase mb-3">{post.category}</p>
        <h1 className="text-[36px] sm:text-[44px] font-bold text-slate-900 leading-[1.15] tracking-tight mb-4">
          {post.title}
        </h1>
        <p className="text-[17px] text-slate-500 leading-relaxed mb-6">
          {post.description}
        </p>

        <div className="flex items-center gap-3 text-[13px] text-slate-500 mb-10 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-[14px] font-bold text-[#0A6A47]">
            {post.author.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-700">{post.author}</p>
            <p className="text-[12px] text-slate-400">
              {post.authorRole} ·{' '}
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>{' '}
              · {post.readMinutes} min read
            </p>
          </div>
        </div>

        {post.tldr && (
          <div className="mb-10 p-5 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-[11px] font-bold tracking-widest text-emerald-700 uppercase mb-2">TL;DR</p>
            <p className="text-[14px] text-slate-700 leading-relaxed">{post.tldr}</p>
          </div>
        )}

        <div
          className="prose-content text-[16px] text-slate-700 leading-[1.75]"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {post.faq && post.faq.length > 0 && (
          <section className="mt-14 pt-10 border-t border-slate-100">
            <h2 className="text-[28px] font-bold text-slate-900 mb-6 tracking-tight">Frequently asked questions</h2>
            <div className="space-y-5">
              {post.faq.map((f, i) => (
                <div key={i} className="border-b border-slate-100 pb-5 last:border-0">
                  <h3 className="text-[16px] font-bold text-slate-900 mb-2">{f.q}</h3>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 p-7 rounded-2xl bg-[#0A6A47] text-white">
          <h2 className="text-[22px] font-bold mb-2">Track every job — free, forever.</h2>
          <p className="text-[14px] text-white/75 mb-5 max-w-md">
            PebelAI auto-saves jobs from LinkedIn, Naukri & Indeed, sends follow-up reminders, and includes a free AI interview coach.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-[#0A6A47] text-[14px] font-bold hover:bg-emerald-50 transition-colors"
          >
            Get started — it's free
          </Link>
        </section>

        {related.length > 0 && (
          <section className="mt-14 pt-10 border-t border-slate-100">
            <h2 className="text-[20px] font-bold text-slate-900 mb-6 tracking-tight">Keep reading</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="block p-5 rounded-xl border border-slate-100 hover:border-[#0A6A47]/30 transition-all"
                >
                  <p className="text-[11px] font-semibold tracking-wide uppercase text-emerald-700 mb-2">{r.category}</p>
                  <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-2">{r.title}</h3>
                  <p className="text-[12px] text-slate-500 leading-relaxed">{r.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <footer className="border-t border-slate-100 mt-12">
        <div className="max-w-3xl mx-auto px-6 py-10 text-center text-[12px] text-slate-400">
          © {new Date().getFullYear()} PebelAI · <Link href="/privacy" className="hover:text-slate-600">Privacy</Link> · <Link href="/terms" className="hover:text-slate-600">Terms</Link>
        </div>
      </footer>
    </main>
  )
}
