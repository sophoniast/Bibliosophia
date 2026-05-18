import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate } from 'animejs'
import { useNavigate } from 'react-router-dom'
import { askReader } from '../lib/api'
import { useTheme } from '../context/ThemeContext'

const DAILY_VERSES = [
  {
    v: 'In the beginning was the Word, and the Word was with God...',
    ref: 'John 1:1',
    ex: "The Greek term <span class='marker-highlight italic'>Logos (Λόγος)</span> implies not just spoken word, but the divine reason and structuring principle implicit in the cosmos.",
  },
  {
    v: 'And the earth was without form, and void; and darkness was upon the face of the deep.',
    ref: 'Genesis 1:2',
    ex: "The Hebrew phrase <span class='marker-highlight italic'>Tohu wa-Bohu</span> describes a state of utter desolation, contrasting the divine order God brings through light.",
  },
  {
    v: 'For with thee is the fountain of life: in thy light shall we see light.',
    ref: 'Psalm 36:9',
    ex: "Light (<span class='marker-highlight italic'>'owr</span>) here is coupled with life, showing that divine revelation is the prerequisite for true human understanding.",
  },
]

const MENU_CONFIG = [
  { id: 'READ', glyph: 'א', desc: 'Canonical Texts', x: -350, y: 150, mod: 'mod-read' },
  { id: 'MAPS', glyph: 'Δ', desc: 'Cartography', x: 0, y: 150, mod: 'mod-maps' },
  { id: 'SCRIBE', glyph: 'Φ', desc: 'AI Exegesis', x: 350, y: 150, mod: 'mod-scribe' },
]

const MOBILE_MENU_POSITIONS = [
  { x: -92, y: 130 },
  { x: 92, y: 130 },
  { x: 0, y: 292 },
]

function HomePage({ initialModule = null }) {
  const navigate = useNavigate()
  const { mode, themeName, themes, toggleMode, setThemeName } = useTheme()
  const galaxyRef = useRef(null)
  const blobBgRef = useRef(null)
  const titleRef = useRef(null)
  const taglineRef = useRef(null)
  const hintRef = useRef(null)
  const dailyCardRef = useRef(null)
  const nodeDataRef = useRef([])
  const ringDataRef = useRef([])
  const scrollYRef = useRef(0)
  const targetScrollYRef = useRef(0)
  const galaxyTimeRef = useRef(0)
  const activeModuleRef = useRef(null)
  const isWarpedRef = useRef(false)
  const isLiteSceneRef = useRef(false)
  const isThemePanelOpenRef = useRef(false)
  const lastLiteFrameTimeRef = useRef(0)
  const rafRef = useRef(0)

  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false)
  const [activeModule, setActiveModule] = useState(null)
  const [aiInput, setAiInput] = useState('')
  const [aiOutput, setAiOutput] = useState(
    '"Welcome, seeker of truth. What scripture shall we illuminate today to draw closer to Christ?"',
  )

  const activeVerse = useMemo(() => {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
    return DAILY_VERSES[dayOfYear % DAILY_VERSES.length]
  }, [])

  useEffect(() => {
    isThemePanelOpenRef.current = isThemePanelOpen
  }, [isThemePanelOpen])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const wrapper = document.getElementById('theme-ui-wrapper')
      if (isThemePanelOpen && wrapper && !wrapper.contains(event.target)) {
        setIsThemePanelOpen(false)
      }
    }

    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [isThemePanelOpen])

  useEffect(() => {
    const handleScroll = () => {
      if (!isWarpedRef.current) {
        targetScrollYRef.current = window.scrollY
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const warpToModule = useCallback((moduleId) => {
    if (moduleId === 'mod-read') {
      navigate('/reader')
      return
    }

    if (moduleId === 'mod-maps') {
      navigate('/map')
      return
    }

    isWarpedRef.current = true
    dailyCardRef.current?.classList.remove('visible')
    animate(galaxyRef.current?.querySelectorAll('.glyph-wrapper'), {
      translateZ: '+=1500',
      opacity: [1, 0],
      duration: 600,
      ease: 'inExpo',
      onComplete: () => setActiveModule(moduleId),
    })
  }, [navigate])

  function closeModule() {
    setActiveModule(null)
    animate(galaxyRef.current?.querySelectorAll('.glyph-wrapper'), {
      translateZ: '-=1500',
      opacity: [0, 1],
      duration: 800,
      ease: 'outExpo',
      onComplete: () => {
        isWarpedRef.current = false
        dailyCardRef.current?.classList.add('visible')
      },
    })
  }

  useEffect(() => {
    const galaxy = galaxyRef.current
    if (!galaxy) return undefined

    isLiteSceneRef.current = window.matchMedia(
      '(max-width: 900px), (pointer: coarse), (prefers-reduced-motion: reduce)',
    ).matches
    const isLiteScene = isLiteSceneRef.current

    galaxy.innerHTML = ''
    nodeDataRef.current = []
    ringDataRef.current = []

    const ringCount = isLiteScene ? 2 : 6
    const letterCount = isLiteScene ? 28 : 150

    for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
      const ring = document.createElement('div')
      ring.className = 'uploaded-astrolabe-ring'
      const size = isLiteScene ? 260 + ringIndex * 180 : 800 + ringIndex * 600
      ring.style.width = `${size}px`
      ring.style.height = `${size}px`
      galaxy.appendChild(ring)

      ringDataRef.current.push({
        el: ring,
        rx: Math.random() * 360,
        ry: Math.random() * 360,
        rz: Math.random() * 360,
        speedX: (Math.random() - 0.5) * 0.1,
        speedY: (Math.random() - 0.5) * 0.1,
        speedZ: (Math.random() - 0.5) * 0.1,
        baseZ: -500 - ringIndex * 800,
      })
    }

    MENU_CONFIG.forEach((config, index) => {
      const mobilePosition = MOBILE_MENU_POSITIONS[index] || { x: 0, y: 0 }
      const wrapper = document.createElement('div')
      wrapper.className = 'glyph-wrapper is-menu'

      const inner = document.createElement('div')
      inner.className = 'glyph-inner menu-inner'
      inner.innerHTML = `
        <div class="glyph-icon">${config.glyph}</div>
        <div class="card-ui">
          <span class="menu-id">${config.id}</span>
          <span class="menu-desc">${config.desc}</span>
          <div class="menu-access-wrap">
            <span class="menu-access">Access</span>
          </div>
        </div>
      `

      wrapper.onclick = () => warpToModule(config.mod)
      wrapper.appendChild(inner)
      galaxy.appendChild(wrapper)

      nodeDataRef.current.push({
        el: wrapper,
        isMenu: true,
        menu: isLiteScene ? { ...config, ...mobilePosition } : config,
        baseX: 0,
        baseY: 0,
        baseZ: isLiteScene ? -1400 : -3000,
        rx: Math.random() * 360,
        ry: Math.random() * 360,
        rz: Math.random() * 360,
        speed: 0.2 + Math.random() * 0.5,
      })
    })

    let pureLetters = activeVerse.v.replace(/[^a-zA-Z]/g, '').split('')
    while (pureLetters.length < letterCount) pureLetters = pureLetters.concat(pureLetters)
    pureLetters = pureLetters.slice(0, letterCount)

    pureLetters.forEach((letter) => {
      const wrapper = document.createElement('div')
      wrapper.className = 'glyph-wrapper'

      const inner = document.createElement('div')
      inner.className = 'glyph-inner ink-letter'
      inner.innerText = letter
      const baseScale = 0.5 + Math.random() * 1.5
      inner.style.fontSize = `${20 * baseScale}px`
      inner.style.opacity = 0.3 + Math.random() * 0.5

      wrapper.appendChild(inner)
      galaxy.appendChild(wrapper)

      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const radius = 50 + Math.random() * 150

      nodeDataRef.current.push({
        el: wrapper,
        isMenu: false,
        innerEl: inner,
        baseX: radius * Math.sin(phi) * Math.cos(theta),
        baseY: radius * Math.sin(phi) * Math.sin(theta),
        baseZ: (isLiteScene ? -500 : -2000) + radius * Math.cos(phi),
        driftSpeedX: (Math.random() - 0.5) * 3,
        driftSpeedY: (Math.random() - 0.5) * 3,
        growthRate: 1 + Math.random() * 3,
        offset: Math.random() * 100,
      })
    })

    animate(titleRef.current, {
      translateY: [60, 0],
      opacity: [0, 1],
      duration: 2000,
      delay: 400,
      ease: 'outExpo',
    })
    animate(taglineRef.current, {
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 1500,
      delay: 900,
      ease: 'outExpo',
    })
    animate(hintRef.current, {
      opacity: [0, 1],
      duration: 1500,
      delay: 1300,
      ease: 'outExpo',
    })

    const loop = () => {
      if (isLiteScene) {
        const now = window.performance.now()
        if (now - lastLiteFrameTimeRef.current < 66) {
          rafRef.current = window.requestAnimationFrame(loop)
          return
        }
        lastLiteFrameTimeRef.current = now
      }

      if (blobBgRef.current) {
        blobBgRef.current.style.transform = isLiteScene
          ? 'translateY(0)'
          : `translateY(${-scrollYRef.current * 0.05}px)`
      }

      if (!isWarpedRef.current) {
        scrollYRef.current += (targetScrollYRef.current - scrollYRef.current) * (isLiteScene ? 0.22 : 0.08)
        galaxyTimeRef.current += isLiteScene ? 0.002 : 0.005

        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        const scrollPercent = Math.min(1, Math.max(0, scrollYRef.current / maxScroll))

        ringDataRef.current.forEach((ring) => {
          const zMove = scrollPercent * (isLiteScene ? 900 : 7000)
          const z = ring.baseZ + zMove
          ring.rx += ring.speedX * (isLiteScene ? 0.2 : 1)
          ring.ry += ring.speedY * (isLiteScene ? 0.2 : 1)
          ring.rz += ring.speedZ * (isLiteScene ? 0.2 : 1)
          ring.el.style.transform = `translate3d(-50%, -50%, ${z}px) rotateX(${ring.rx}deg) rotateY(${ring.ry}deg) rotateZ(${ring.rz}deg)`
          ring.el.style.opacity = Math.max(0, 0.7 - scrollPercent * 1.2)
        })

        nodeDataRef.current.forEach((node) => {
          if (node.isMenu) {
            let easeOut = 0
            const mStart = 0.15
            const mEnd = 0.55

            if (scrollPercent > mStart) {
              const t = Math.min(1, (scrollPercent - mStart) / (mEnd - mStart))
              easeOut = 1 - (1 - t) ** 3
            }

            const spinSpeed = 1 - easeOut
            node.rx += 0.005 * node.speed * 20 * spinSpeed
            node.ry += 0.005 * node.speed * 20 * spinSpeed
            node.rz += 0.005 * node.speed * 10 * spinSpeed

            const flightZ = node.baseZ + scrollPercent * (isLiteScene ? 3600 : 8000)
            const targetX = lerp(0, node.menu.x, easeOut)
            const targetY = lerp(0, node.menu.y, easeOut)
            const targetZ = lerp(flightZ, 150, easeOut)

            const dockRX = Math.round(node.rx / 360) * 360
            const dockRY = Math.round(node.ry / 360) * 360
            const dockRZ = Math.round(node.rz / 360) * 360

            const finalRX = lerp(node.rx, dockRX, easeOut)
            const finalRY = lerp(node.ry, dockRY, easeOut)
            const finalRZ = lerp(node.rz, dockRZ, easeOut)

            if (scrollPercent > mStart) {
              const t = Math.min(1, (scrollPercent - mStart) / (mEnd - mStart))
              if (t > 0.95) node.el.classList.add('active')
              else node.el.classList.remove('active')
            } else {
              node.el.classList.remove('active')
            }

            node.el.style.transform = `translate3d(${targetX}px, ${targetY}px, ${targetZ}px) rotateX(${finalRX}deg) rotateY(${finalRY}deg) rotateZ(${finalRZ}deg)`
          } else {
            const spreadMultiplier = 1 + scrollPercent * (isLiteScene ? 4 : 30)
            const driftX = Math.sin(galaxyTimeRef.current * node.driftSpeedX + node.offset) * ((isLiteScene ? 22 : 100) * scrollPercent)
            const driftY = Math.cos(galaxyTimeRef.current * node.driftSpeedY + node.offset) * ((isLiteScene ? 22 : 100) * scrollPercent)

            const x = node.baseX * spreadMultiplier + driftX
            const y = node.baseY * spreadMultiplier + driftY
            const z = node.baseZ + scrollPercent * (isLiteScene ? 600 : 6000)

            node.el.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`

            const scaleAmt = 1 + scrollPercent * node.growthRate
            const blurAmt = isLiteScene ? 0 : Math.max(0, scrollPercent * 15 - 2)
            const fadeAmt = Math.max(0, 1 - scrollPercent * 1.5)

            node.innerEl.style.transform = `translate(-50%, -50%) scale(${scaleAmt})`
            if (!isLiteScene) {
              node.innerEl.style.filter = `blur(${blurAmt}px)`
            }
            node.innerEl.style.opacity = fadeAmt
          }
        })

        const heroOpacity = Math.max(0, 1 - scrollPercent * 6)
        if (titleRef.current?.parentElement) {
          titleRef.current.parentElement.style.opacity = heroOpacity
        }

        if (dailyCardRef.current) {
          if (!isThemePanelOpenRef.current && scrollPercent > 0.68) dailyCardRef.current.classList.add('visible')
          else dailyCardRef.current.classList.remove('visible')
        }
      }

      rafRef.current = window.requestAnimationFrame(loop)
    }

    loop()

    return () => {
      window.cancelAnimationFrame(rafRef.current)
      galaxy.innerHTML = ''
    }
  }, [activeVerse.v, warpToModule])

  useEffect(() => {
    activeModuleRef.current = activeModule
    isWarpedRef.current = Boolean(activeModule)
    document.body.style.overflow = activeModule ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [activeModule])

  useEffect(() => {
    if (!initialModule) return
    setActiveModule(initialModule)
  }, [initialModule])

  const askScribeHandler = async () => {
    const question = aiInput.trim()
    if (!question) return

    setAiOutput("<span class='marker-highlight animate-pulse'>✨ Deciphering ancient texts...</span>")
    setAiInput('')

    try {
      const result = await askReader({
        question,
        readingTitle: 'Selected Scripture',
        selectedEntry: null,
      })
      setAiOutput(result.answer.replace(/\n/g, '<br/>'))
    } catch {
      setAiOutput('Error: Connection lost. The study assistant is currently unreachable.')
    }
  }

  return (
    <div className="uploaded-homepage">
      <style>{`
        .theme-dock { display: none !important; }
        .uploaded-homepage {
          min-height: 100vh;
          color: rgb(var(--c-text));
          cursor: crosshair;
          overflow-x: hidden;
          background-color: rgb(var(--c-bg));
          transition: background-color 1s ease, color 1s ease;
        }
        .uploaded-homepage * { box-sizing: border-box; }
        .uploaded-homepage .no-scrollbar::-webkit-scrollbar { display: none; }
        .uploaded-homepage .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .noise-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        #blob-bg {
          position: fixed;
          inset: -20%;
          z-index: 0;
          pointer-events: none;
          background-color: rgb(var(--c-bg));
          transition: background-color 1s ease;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.7;
          animation: uploadedFloatBlob 20s infinite alternate ease-in-out;
          will-change: transform;
          transition: background-color 1s ease;
        }
        .blob-1 { width: 70vw; height: 70vw; background: rgba(var(--c-text), 0.05); top: -10%; left: -20%; animation-duration: 25s; }
        .blob-2 { width: 50vw; height: 50vw; background: rgba(var(--c-accent), 0.25); bottom: -10%; right: -10%; animation-duration: 22s; animation-direction: alternate-reverse; }
        .blob-3 { width: 60vw; height: 60vw; background: rgba(var(--c-accent), 0.15); top: 20%; left: 30%; animation-duration: 28s; }
        @keyframes uploadedFloatBlob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(15vw, 10vh) scale(1.1); }
          66% { transform: translate(-10vw, 20vh) scale(0.9); }
          100% { transform: translate(10vw, -10vh) scale(1); }
        }
        #theme-ui-wrapper {
          position: fixed;
          right: 2rem;
          bottom: 2rem;
          z-index: 10020;
          display: flex;
          flex-direction: column-reverse;
          align-items: center;
          gap: 1rem;
        }
        .theme-main-toggle {
          width: 3rem;
          height: 3rem;
          border-radius: 999px;
          border: 1px solid rgba(var(--c-accent), 0.2);
          background: rgba(var(--c-bg), 0.8);
          backdrop-filter: blur(20px);
          color: rgba(var(--c-accent), 0.8);
          display: grid;
          place-items: center;
          box-shadow: 0 0 20px rgba(var(--c-accent), 0.15);
        }
        #theme-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(var(--c-bg), 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(var(--c-accent), 0.2);
          border-radius: 999px;
          padding: 1rem 0.5rem;
          box-shadow: 0 25px 60px rgba(0,0,0,0.35);
          opacity: 0;
          pointer-events: none;
          transform: translateY(2rem);
          transition: all 0.5s ease;
          max-height: 60vh;
          overflow-y: auto;
        }
        #theme-panel.open {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }
        .mode-toggle-btn {
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          border: 0;
          background: transparent;
          color: rgba(var(--c-accent), 0.8);
          margin-bottom: 0.75rem;
        }
        .theme-divider {
          width: 1.5rem;
          height: 1px;
          background: rgba(var(--c-accent), 0.2);
          margin-bottom: 0.75rem;
        }
        .theme-list {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
        }
        .theme-swatch-btn {
          position: relative;
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          transition: all 0.3s ease;
          outline: none;
        }
        .theme-swatch-btn.active { transform: scale(1.1); z-index: 10; }
        .theme-swatch-btn:not(.active) { transform: scale(0.9); opacity: 0.6; }
        .theme-swatch-inner {
          position: absolute;
          inset: 2px;
          border-radius: 999px;
          opacity: 0.8;
        }
        #scroll-engine { height: 250vh; }
        #viewport {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100svh;
          perspective: 2000px;
          z-index: 10;
          pointer-events: none;
          touch-action: pan-y;
        }
        .galaxy-scene {
          position: relative;
          transform-style: preserve-3d;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        #hero {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          text-align: center;
        }
        #title {
          color: rgb(var(--c-accent));
          font-family: var(--f-serif);
          font-size: clamp(4rem, 10vw, 7rem);
          font-style: italic;
          letter-spacing: -0.05em;
          opacity: 0;
          filter: drop-shadow(0 25px 30px rgba(0,0,0,0.45));
          margin: 0;
        }
        #tagline {
          color: rgba(var(--c-text), 0.4);
          font-family: var(--f-mono);
          font-size: 10px;
          letter-spacing: 0.8em;
          text-transform: uppercase;
          margin-top: 1.5rem;
          opacity: 0;
        }
        #hint {
          margin-top: 5rem;
          opacity: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hint-line {
          width: 1px;
          height: 4rem;
          background: linear-gradient(180deg, rgba(var(--c-accent), 1), transparent);
          opacity: 0.6;
        }
        .hint-text {
          margin-top: 1.5rem;
          color: rgba(var(--c-accent), 0.6);
          font-family: var(--f-mono);
          font-size: 9px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          animation: uploadedPulse 1.8s infinite;
        }
        @keyframes uploadedPulse {
          0%,100% { opacity: 0.65; }
          50% { opacity: 1; }
        }
        .glyph-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          pointer-events: none;
          transform-style: preserve-3d;
          will-change: transform;
        }
        .glyph-wrapper.is-menu { z-index: 1000; }
        .glyph-wrapper.is-menu.active { pointer-events: auto; cursor: pointer; }
        .glyph-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: rgba(var(--c-accent), 0.3);
          font-family: var(--f-serif);
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          transition: opacity 0.5s ease;
          will-change: transform, filter, opacity;
        }
        .ink-letter {
          font-weight: 700;
          text-shadow: 0 0 15px rgba(var(--c-accent), 0.4);
        }
        .menu-inner {
          font-size: 64px;
          color: rgba(var(--c-accent), 0.9);
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          background: transparent;
          border: 1px solid transparent;
          padding: 0;
          overflow: hidden;
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1), background-color 1s ease, border-color 1s ease;
        }
        .glyph-icon { transition: transform 0.6s ease; }
        .card-ui {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s;
          text-align: center;
          display: none;
        }
        .menu-id {
          font-family: var(--f-mono);
          color: rgb(var(--c-accent));
          font-size: 0.875rem;
          letter-spacing: 0.4em;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .menu-desc {
          color: rgba(var(--c-text), 0.6);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3em;
        }
        .menu-access-wrap { margin-top: auto; padding-top: 1.5rem; }
        .menu-access {
          padding: 0.5rem 1rem;
          border: 1px solid rgba(var(--c-accent), 0.3);
          border-radius: 999px;
          font-size: 9px;
          color: rgb(var(--c-accent));
          text-transform: uppercase;
          letter-spacing: 0.3em;
        }
        @keyframes golden-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(var(--c-accent), 0.1), inset 0 0 10px rgba(var(--c-accent), 0.05); }
          50% { box-shadow: 0 0 35px rgba(var(--c-accent), 0.2), inset 0 0 20px rgba(var(--c-accent), 0.1); }
        }
        .glyph-wrapper.is-menu.active .menu-inner {
          width: 220px;
          height: 280px;
          padding: 30px 20px;
          background: rgba(var(--c-bg), 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(var(--c-accent), 0.25);
          animation: golden-pulse 4s ease-in-out infinite;
        }
        .glyph-wrapper.is-menu.active .glyph-icon {
          font-size: 42px;
          transform: translateY(-10px);
          text-shadow: 0 0 20px rgba(var(--c-accent), 0.5);
        }
        .glyph-wrapper.is-menu.active .card-ui {
          display: flex;
          flex-direction: column;
          opacity: 1;
          transform: translateY(0);
        }
        .glyph-wrapper.is-menu.active:hover .menu-inner {
          animation: none;
          background: rgba(var(--c-bg), 0.85);
          border-color: rgba(var(--c-accent), 0.8);
          box-shadow: 0 0 50px rgba(var(--c-accent), 0.3), inset 0 0 30px rgba(var(--c-accent), 0.1);
          transform: translate(-50%, calc(-50% - 15px)) scale(1.05);
        }
        .marker-highlight {
          position: relative;
          display: inline-block;
          color: inherit;
          z-index: 1;
          font-weight: 600;
          padding: 0 4px;
        }
        .marker-highlight::before {
          content: '';
          position: absolute;
          left: -0.1em;
          right: -0.1em;
          top: 10%;
          bottom: 5%;
          background-color: rgb(var(--c-accent));
          opacity: 0.6;
          z-index: -1;
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 150' preserveAspectRatio='none'%3E%3Cpath d='M9.3,127.3c49.3-3,150.7-7.6,199.7-7.4c121.9,0.4,189.9,0.4,282.3,7.2C380.1,129.6,181.2,130.6,70,139 c82.6-2.9,254.2-1,335.9,1.3c-56,1.4-137.2-0.3-197.1,9' stroke='black' stroke-width='80' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E");
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 150' preserveAspectRatio='none'%3E%3Cpath d='M9.3,127.3c49.3-3,150.7-7.6,199.7-7.4c121.9,0.4,189.9,0.4,282.3,7.2C380.1,129.6,181.2,130.6,70,139 c82.6-2.9,254.2-1,335.9,1.3c-56,1.4-137.2-0.3-197.1,9' stroke='black' stroke-width='80' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E");
          -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
          transform-origin: left center;
          transform: scaleX(0);
        }
        .module-layer.active .marker-highlight::before,
        #daily-verse-card.visible .marker-highlight::before {
          animation: highlight-draw 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          animation-delay: 0.6s;
        }
        .marker-highlight.animate-pulse::before {
          animation: highlight-draw 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          animation-delay: 0s;
        }
        @keyframes highlight-draw {
          to { transform: scaleX(1); }
        }
        #daily-verse-card {
          position: fixed;
          top: 10%;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          width: 90%;
          max-width: 700px;
          background: linear-gradient(135deg, rgba(var(--c-bg), 0.7) 0%, rgba(var(--c-bg), 0.95) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(var(--c-accent), 0.2);
          border-radius: 16px;
          padding: 30px 40px;
          z-index: 100;
          opacity: 0;
          pointer-events: none;
          transition: opacity 1.2s ease 0.1s, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, background 1s ease;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }
        #daily-verse-card.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          pointer-events: auto;
        }
        .daily-card-header {
          color: rgb(var(--c-accent));
          font-family: var(--f-mono);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.4em;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(var(--c-accent), 0.1);
          padding-bottom: 0.75rem;
        }
        .daily-dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 999px;
          background: rgb(var(--c-accent));
          margin-right: 0.75rem;
          animation: uploadedPulse 1.4s infinite;
        }
        .verse-text {
          font-size: 2rem;
          font-family: var(--f-sans);
          font-style: italic;
          color: rgba(var(--c-text), 0.9);
          line-height: 1.5;
          margin: 0 0 0.5rem;
        }
        .verse-ref {
          color: rgba(var(--c-accent), 0.6);
          font-family: var(--f-mono);
          font-size: 12px;
          letter-spacing: 0.2em;
          margin-bottom: 1rem;
        }
        .verse-insight {
          font-size: 13px;
          color: rgba(var(--c-text), 0.6);
          line-height: 1.7;
          background: rgba(0,0,0,0.1);
          padding: 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .module-layer {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: none;
          background: rgba(var(--c-bg), 0.6);
          backdrop-filter: blur(16px);
          opacity: 0;
          transition: opacity 0.6s ease, background-color 1s ease;
        }
        .module-layer.active { display: block; opacity: 1; }
        .module-shell {
          width: 100%;
          max-width: 56rem;
          max-height: 85vh;
          background: rgba(var(--c-bg), 0.8);
          backdrop-filter: blur(28px);
          padding: 2.5rem 3rem;
          border-radius: 1.5rem;
          border: 1px solid rgba(var(--c-accent), 0.2);
          box-shadow: 0 30px 60px rgba(0,0,0,0.35);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .module-close {
          position: absolute;
          top: 2rem;
          right: 2rem;
          border: 0;
          background: transparent;
          color: rgba(var(--c-accent), 0.5);
          font-size: 1.5rem;
        }
        .module-center {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 3rem;
        }
        .module-label {
          font-family: var(--f-mono);
          font-size: 12px;
          letter-spacing: 0.5em;
          text-transform: uppercase;
          margin-bottom: 2rem;
          color: rgb(var(--c-accent));
          flex-shrink: 0;
        }
        #ai-output {
          font-size: clamp(1.3rem, 3vw, 2rem);
          font-family: var(--f-sans);
          font-style: italic;
          color: rgba(var(--c-text), 0.9);
          line-height: 1.6;
          margin-bottom: 2rem;
          flex-grow: 1;
          overflow-y: auto;
        }
        .scribe-input-wrap {
          position: relative;
          margin-top: auto;
          flex-shrink: 0;
        }
        .scribe-input {
          width: 100%;
          background: transparent;
          border: 0;
          border-bottom: 1px solid rgba(var(--c-accent), 0.3);
          padding: 0.75rem 0;
          font-size: 1rem;
          color: rgb(var(--c-accent));
          outline: none;
        }
        .scribe-send {
          position: absolute;
          right: 0;
          bottom: 0.75rem;
          border: 0;
          background: transparent;
          color: rgba(var(--c-accent), 0.5);
          font-size: 1.2rem;
        }
        .read-module {
          position: fixed;
          inset: 0;
          overflow-y: auto;
        }
        .read-header {
          height: 5rem;
          padding: 0 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(var(--c-accent), 0.1);
          background: rgba(var(--c-bg), 0.8);
          backdrop-filter: blur(16px);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .read-back {
          border: 0;
          background: transparent;
          color: rgb(var(--c-accent));
          font-family: var(--f-mono);
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }
        .read-title {
          color: rgba(var(--c-accent), 0.5);
          font-family: var(--f-serif);
          font-style: italic;
        }
        .read-main {
          max-width: 48rem;
          margin: 0 auto;
          padding: 6rem 3rem;
          font-family: var(--f-sans);
          font-size: 2rem;
          line-height: 1.8;
          color: rgba(var(--c-text), 0.9);
          display: grid;
          gap: 3rem;
        }
        .verse-line {
          position: relative;
          margin: 0;
        }
        .verse-index {
          position: absolute;
          left: -3rem;
          top: 0.2rem;
          color: rgba(var(--c-accent), 0.6);
          font-family: var(--f-mono);
          font-size: 12px;
        }
        .placeholder-module {
          height: 100%;
          display: grid;
          place-items: center;
          padding: 2rem;
        }
        .placeholder-card {
          max-width: 40rem;
          background: rgba(var(--c-bg), 0.82);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(var(--c-accent), 0.2);
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 30px 60px rgba(0,0,0,0.3);
        }
        .placeholder-card h3 {
          margin: 0 0 1rem;
          color: rgb(var(--c-accent));
          font-family: var(--f-mono);
          font-size: 12px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
        }
        .placeholder-card p {
          margin: 0;
          color: rgba(var(--c-text), 0.8);
          font-family: var(--f-sans);
          line-height: 1.7;
        }
        .uploaded-astrolabe-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border: 1px solid rgba(var(--c-accent), 0.15);
          border-radius: 50%;
          transform-style: preserve-3d;
          pointer-events: none;
          will-change: transform;
          filter: drop-shadow(0 0 10px rgba(var(--c-accent), 0.1));
        }
        .uploaded-astrolabe-ring::before {
          content: '';
          position: absolute;
          inset: 6px;
          border: 1px dashed rgba(var(--c-text), 0.2);
          border-radius: 50%;
          opacity: 0.5;
        }
        @media (max-width: 900px) {
          .uploaded-homepage {
            cursor: auto;
            min-height: 100svh;
            overflow-x: clip;
          }
          .noise-overlay {
            opacity: 0.025;
          }
          .blob {
            filter: blur(64px);
            opacity: 0.45;
            animation-duration: 34s;
          }
          #scroll-engine {
            height: 230svh;
          }
          #viewport {
            position: fixed;
            inset: 0;
            height: 100svh;
            perspective: 1200px;
          }
          #hero {
            justify-content: center;
            padding: 0 1.25rem;
          }
          #title {
            font-size: clamp(3rem, 16vw, 4.4rem);
            letter-spacing: 0;
          }
          #tagline {
            max-width: 20rem;
            font-size: 9px;
            line-height: 1.8;
            letter-spacing: 0.32em;
          }
          #hint {
            margin-top: 2rem;
          }
          .hint-line {
            height: 3rem;
          }
          .hint-text {
            max-width: 16rem;
            letter-spacing: 0.2em;
            font-size: 10px;
          }
          #daily-verse-card {
            position: fixed;
            top: 12%;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            width: calc(100% - 2rem);
            max-height: min(64svh, 34rem);
            overflow-y: auto;
            padding: 1.25rem;
            border-radius: 0.75rem;
          }
          #daily-verse-card.visible {
            transform: translateX(-50%) translateY(0);
          }
          .verse-text { font-size: 1.18rem; }
          .verse-insight { font-size: 12px; }
          .glyph-wrapper.is-menu.active .menu-inner {
            width: 132px;
            height: 146px;
            padding: 1rem 0.75rem;
            border-radius: 0.75rem;
            backdrop-filter: blur(10px);
            animation: none;
          }
          .glyph-wrapper.is-menu.active .glyph-icon {
            font-size: 32px;
            transform: translateY(0);
          }
          .menu-id {
            font-size: 0.68rem;
            letter-spacing: 0.18em;
            margin-top: 0.5rem;
          }
          .menu-desc {
            font-size: 8px;
            letter-spacing: 0.12em;
            line-height: 1.5;
          }
          .menu-access-wrap {
            padding-top: 0.8rem;
          }
          .menu-access {
            padding: 0.4rem 0.6rem;
            font-size: 8px;
            letter-spacing: 0.14em;
          }
          .glyph-inner {
            will-change: transform, opacity;
          }
          .read-main { font-size: 1.4rem; padding: 4rem 1.5rem; }
          .read-header { padding: 0 1.5rem; }
          .module-center { padding: 1rem; }
          .module-shell { padding: 2rem 1.5rem; }
          #theme-ui-wrapper {
            right: 1rem;
            bottom: max(1rem, env(safe-area-inset-bottom));
          }
          #theme-panel {
            max-height: min(62svh, 24rem);
            background: rgba(var(--c-bg), 0.94);
          }
        }
      `}</style>

      <div className="noise-overlay" />

      <div id="blob-bg" ref={blobBgRef}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div id="theme-ui-wrapper">
        <button className="theme-main-toggle" onClick={() => setIsThemePanelOpen((value) => !value)} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </button>

        <div className={`no-scrollbar ${isThemePanelOpen ? 'open' : ''}`} id="theme-panel">
          <button
            className="mode-toggle-btn"
            onClick={toggleMode}
            type="button"
          >
            {mode === 'night' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            )}
          </button>

          <div className="theme-divider" />

          <div className="theme-list">
            {themes.map((theme) => {
              const palette = theme[mode]
              const isActive = theme.id === themeName
              return (
                <button
                  key={theme.id}
                  className={`theme-swatch-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setThemeName(theme.id)}
                  style={{
                    backgroundColor: palette.bg,
                    border: `2px solid ${isActive ? palette.accent : 'rgba(var(--c-text), 0.2)'}`,
                    boxShadow: isActive ? '0 0 15px rgba(var(--c-accent), 0.5)' : 'none',
                  }}
                  title={`${theme.name} | ${theme.description}`}
                  type="button"
                >
                  <div
                    className="theme-swatch-inner"
                    style={{ background: `linear-gradient(135deg, ${palette.bg}, ${palette.accent})` }}
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div id="scroll-engine" />

      <div id="viewport">
        <div className="galaxy-scene" id="galaxy" ref={galaxyRef} />

        <div id="hero">
          <h1 id="title" ref={titleRef}>Bibliosophia</h1>
          <p id="tagline" ref={taglineRef}>Sacred Glass Architecture</p>
          <div id="hint" ref={hintRef}>
            <div className="hint-line" />
            <span className="hint-text">Scroll to Ascend</span>
          </div>
        </div>
      </div>

      <div id="daily-verse-card" ref={dailyCardRef}>
        <h4 className="daily-card-header">
          <span className="daily-dot" />
          Insight of the Day
        </h4>
        <h2 className="verse-text">"{activeVerse.v}"</h2>
        <p className="verse-ref">{activeVerse.ref}</p>
        <p className="verse-insight" dangerouslySetInnerHTML={{ __html: `<strong class="marker-highlight" style="font-family:var(--f-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;display:inline-block;margin-bottom:.55rem;">Exegesis</strong><br/>${activeVerse.ex}` }} />
      </div>

      <div className={`module-layer no-scrollbar ${activeModule === 'mod-scribe' ? 'active' : ''}`} id="mod-scribe">
        <div className="module-center">
          <div className="module-shell">
            <button className="module-close" onClick={closeModule} type="button">×</button>
            <h3 className="module-label"><span className="marker-highlight">✨ AI Scribe</span></h3>
            <div id="ai-output" className="no-scrollbar" dangerouslySetInnerHTML={{ __html: aiOutput }} />
            <div className="scribe-input-wrap">
              <input
                className="scribe-input"
                onChange={(event) => setAiInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') askScribeHandler()
                }}
                placeholder="Inquire of the sacred text..."
                type="text"
                value={aiInput}
              />
              <button className="scribe-send" onClick={askScribeHandler} type="button">➜</button>
            </div>
          </div>
        </div>
      </div>

      <div className={`module-layer no-scrollbar ${activeModule === 'mod-read' ? 'active' : ''}`} id="mod-read">
        <div className="read-module">
          <header className="read-header">
            <button className="read-back" onClick={closeModule} type="button">← Return to Hub</button>
            <span className="read-title">Genesis 1</span>
          </header>
          <main className="read-main">
            <p className="verse-line"><span className="verse-index">01</span>In the beginning God created the heaven and the earth.</p>
            <p className="verse-line"><span className="verse-index">02</span>And the earth was without form, and void; and darkness was upon the face of the deep.</p>
            <p className="verse-line"><span className="verse-index">03</span>And God said, Let there be <span className="marker-highlight">light</span>: and there was light.</p>
          </main>
        </div>
      </div>

      <div className={`module-layer ${activeModule === 'mod-maps' ? 'active' : ''}`} id="mod-maps">
        <div className="placeholder-module">
          <div className="placeholder-card">
            <button className="module-close" onClick={closeModule} type="button">×</button>
            <h3>Δ Cartography</h3>
            <p>The uploaded home page uses a floating module reveal. This panel mirrors that behavior while keeping the same glass architecture.</p>
          </div>
        </div>
      </div>

    </div>
  )
}

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end
}

export default HomePage
