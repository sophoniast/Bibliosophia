import { getRouteMeta, canonicalUrl } from '../seo/routeMeta.js'
import { absoluteUrl } from '../seo/site.js'

function DocumentMeta({ pathname }) {
  const route = getRouteMeta(pathname)
  const url = canonicalUrl(route.path)
  const image = absoluteUrl(route.ogImage)

  return (
    <>
      <title>{route.title}</title>
      <meta name="description" content={route.description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Bibliosophia" />
      <meta property="og:title" content={route.title} />
      <meta property="og:description" content={route.description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={route.title} />
      <meta name="twitter:description" content={route.description} />
      <meta name="twitter:image" content={image} />
    </>
  )
}

export default DocumentMeta
