import { Link } from 'react-router-dom'
import JsonLd from './JsonLd'
import { buildHubJsonLd, getRouteMeta } from '../seo/routeMeta.js'

function SeoLanding({ pathname, variant = 'panel' }) {
  const route = getRouteMeta(pathname)

  return (
    <section
      aria-label={`${route.eyebrow} overview`}
      className={`seo-landing seo-landing-${variant}`}
      data-seo-path={route.path}
    >
      <details className="seo-landing-details glass-panel">
        <summary>
          <span className="seo-eyebrow">{route.eyebrow}</span>
          <strong>{route.h1}</strong>
        </summary>
        <div className="seo-landing-body">
          {route.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <nav aria-label="Bibliosophia routes" className="seo-links">
            {route.links.map((link) => (
              <Link key={link.href} to={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="seo-faq">
            <h2>FAQ</h2>
            {route.faqs.map((faq) => (
              <div className="seo-faq-item" key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </details>
      {route.jsonLd === 'hub' ? <JsonLd data={buildHubJsonLd(route)} /> : null}
    </section>
  )
}

export default SeoLanding
