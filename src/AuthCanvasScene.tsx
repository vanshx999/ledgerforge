import { useEffect, useRef } from 'react'

type Props = { active: number; onSelectStage: (stage: number) => void }

type Point = { x: number; y: number }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
export const normalizeSceneProgress = (scrollY: number, start: number, end: number) => end <= start ? 0 : clamp((scrollY - start) / (end - start), 0, 1)
export const shouldRunScene = (visible: boolean, reducedMotion: boolean) => visible && !reducedMotion
/** Restart only when the scene is visible, motion is allowed, and no RAF is active. */
export const shouldRestartScene = (visible: boolean, reducedMotion: boolean, frameActive: boolean) => shouldRunScene(visible, reducedMotion) && !frameActive

/** A small, dependency-free canvas scene that makes the review mechanics visible. */
export default function AuthCanvasScene({ active, onSelectStage }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLElement>(null)
  const visibleRef = useRef(true)
  const reducedRef = useRef(false)
  const pointerRef = useRef({ x: 0, y: 0, fine: false })
  const frameRef = useRef<number | null>(null)
  const drawRef = useRef<(() => void) | null>(null)
  const scrollProgressRef = useRef(0)
  const timeRef = useRef(0)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return
    const context2d = canvas.getContext('2d', { alpha: true })
    if (!context2d) return
    const context: CanvasRenderingContext2D = context2d
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedRef.current = media.matches
    let width = 520
    let height = 292
    const resize = () => {
      const rect = host.getBoundingClientRect()
      width = Math.max(280, rect.width)
      height = Math.max(145, rect.height)
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(0)
    }
    let scrollFrame: number | null = null
    const updateScrollProgress = () => {
      const story = host.closest('.auth-story-column')
      const steps = story?.querySelector('.auth-steps') as HTMLElement | null
      const start = (steps?.offsetTop ?? host.offsetTop) - window.innerHeight * .62
      const end = start + Math.max(1, (steps?.offsetHeight ?? 700) - window.innerHeight * .25)
      scrollProgressRef.current = normalizeSceneProgress(window.scrollY, start, end)
      if (reducedRef.current) draw(timeRef.current)
    }
    const onScroll = () => { if (scrollFrame === null) scrollFrame = requestAnimationFrame(() => { scrollFrame = null; updateScrollProgress() }) }
    const onMediaChange = () => { reducedRef.current = media.matches; if (media.matches) draw(timeRef.current); else if (shouldRestartScene(visibleRef.current, reducedRef.current, frameRef.current !== null)) frameRef.current = requestAnimationFrame(loop) }
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || reducedRef.current) return
      const rect = host.getBoundingClientRect()
      pointerRef.current = { x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5, fine: true }
    }
    const onPointerLeave = () => { pointerRef.current = { x: 0, y: 0, fine: false } }
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting
      if (shouldRestartScene(visibleRef.current, reducedRef.current, frameRef.current !== null)) frameRef.current = requestAnimationFrame(loop)
    }, { threshold: .05 })
    observer.observe(host)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    host.addEventListener('pointermove', onPointerMove)
    host.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    media.addEventListener?.('change', onMediaChange)
    resize(); updateScrollProgress()
    const loop = (now: number) => {
      frameRef.current = null
      if (!shouldRunScene(visibleRef.current, reducedRef.current)) return
      timeRef.current = now
      draw(now)
      frameRef.current = requestAnimationFrame(loop)
    }
    if (!reducedRef.current) frameRef.current = requestAnimationFrame(loop)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      observer.disconnect(); resizeObserver.disconnect()
      host.removeEventListener('pointermove', onPointerMove); host.removeEventListener('pointerleave', onPointerLeave); window.removeEventListener('scroll', onScroll); if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
      media.removeEventListener?.('change', onMediaChange)
    }

    function draw(now: number) {
      const ctx = context
      const stage = activeRef.current
      const progress = scrollProgressRef.current
      const inspect = clamp(progress / .3, 0, 1)
      const reconcile = clamp((progress - .18) / .35, 0, 1)
      const lock = clamp((progress - .55) / .4, 0, 1)
      const t = now / 1000
      const pointer = pointerRef.current
      ctx.clearRect(0, 0, width, height)
      const background = ctx.createLinearGradient(0, 0, width, height)
      background.addColorStop(0, '#173728'); background.addColorStop(1, '#0c2017')
      ctx.fillStyle = background; ctx.fillRect(0, 0, width, height)
      const key = ctx.createRadialGradient(width * .2, height * .05, 0, width * .2, height * .05, width * .72)
      key.addColorStop(0, 'rgba(166,220,178,.18)'); key.addColorStop(1, 'rgba(166,220,178,0)')
      ctx.fillStyle = key; ctx.fillRect(0, 0, width, height)
      const tiltX = pointer.fine ? pointer.y * -5 : 0
      const tiltY = pointer.fine ? pointer.x * 5 : 0
      const sx = width / 520; const sy = height / 292
      const project = (point: Point): Point => ({ x: point.x * sx + tiltY * 5, y: point.y * sy + tiltX * 4 })
      const poly = (points: Point[], fill: string, stroke = 'rgba(215,239,220,.3)') => {
        const projected = points.map(project); ctx.beginPath(); ctx.moveTo(projected[0].x, projected[0].y); projected.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.closePath()
        ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke()
      }
      const plane = (x: number, y: number, label: string, token: string, depth: string, accent: boolean) => {
        const top = [{ x, y }, { x: x + 178, y: y - 16 }, { x: x + 178, y: y + 72 }, { x, y: y + 88 }]
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 12; ctx.shadowOffsetX = 7; ctx.shadowOffsetY = 10
        poly(top, accent ? '#e8f3e9' : '#dce9df', accent ? '#7fc092' : 'rgba(215,239,220,.32)'); ctx.restore()
        const p = project({ x: x + 14, y: y + 18 }); ctx.fillStyle = '#52705c'; ctx.font = '700 10px Inter, sans-serif'; ctx.fillText(label.toUpperCase(), p.x, p.y)
        ctx.fillStyle = '#1d3625'; ctx.font = '700 18px Inter, sans-serif'; ctx.fillText(token, p.x, p.y + 25)
        ctx.fillStyle = '#738a79'; ctx.font = '10px Inter, sans-serif'; ctx.fillText(depth, p.x, p.y + 43)
      }
      // Three planes only: frozen bank feed, reconciled ledger, CFO board packet.
      plane(35, 142 - inspect * 9, 'BANK', '8 lines', 'inspect', stage >= 3 || inspect > .4)
      plane(170 - reconcile * 13, 111 - reconcile * 9, 'LEDGER', '8 entries', 'reconcile', stage >= 3 || reconcile > .35)
      plane(305 - lock * 16, 80 - lock * 9, 'BOARD', 'CFO brief', 'decide', stage >= 6 || lock > .4)
      const path = (a: Point, b: Point, activePath: boolean) => { const p1 = project(a); const p2 = project(b); ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.strokeStyle = activePath ? '#83c99a' : 'rgba(137,188,150,.35)'; ctx.lineWidth = activePath ? 2 : 1; ctx.setLineDash(activePath ? [] : [3, 4]); ctx.stroke(); ctx.setLineDash([]) }
      path({ x: 145 - reconcile * 13, y: 169 - inspect * 9 }, { x: 170 - reconcile * 13, y: 153 - reconcile * 9 }, stage >= 2 || reconcile > .2); path({ x: 280 - lock * 16, y: 138 - reconcile * 9 }, { x: 305 - lock * 16, y: 122 - lock * 9 }, stage >= 5 || lock > .2)
      // Transactions travel from the bank plane to the ledger plane; a flagged item reroutes at the skeptic stage.
      for (let i = 0; i < 8; i++) {
        const progress = ((t * .18 + i / 8) % 1)
        const start = project({ x: 53 + i * 11, y: 137 + (i % 3) * 5 }); const end = project({ x: 185 + i * 9, y: 104 + (i % 3) * 4 })
        const x = start.x + (end.x - start.x) * progress; const y = start.y + (end.y - start.y) * progress
        ctx.beginPath(); ctx.arc(x, y, i === 4 && stage >= 4 ? 4 : 2.2, 0, Math.PI * 2); ctx.fillStyle = i === 4 && stage >= 4 ? '#d58a4b' : '#8bd09c'; ctx.fill()
      }
      const node = (point: Point, icon: string, lit: boolean) => { const p = project(point); ctx.beginPath(); ctx.arc(p.x, p.y, lit ? 14 : 11, 0, Math.PI * 2); ctx.fillStyle = lit ? '#2d6b48' : '#214a34'; ctx.fill(); ctx.strokeStyle = lit ? '#96d8a8' : '#5c9470'; ctx.stroke(); ctx.fillStyle = '#e2f4e5'; ctx.font = '700 10px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(icon, p.x, p.y + 3); ctx.textAlign = 'left' }
      node({ x: 100, y: 68 }, 'P', stage >= 2); node({ x: 256, y: 42 }, 'R', stage >= 3); node({ x: 402, y: 154 }, 'S', stage >= 4)
      if (stage >= 4) { const p = project({ x: 387, y: 196 }); ctx.fillStyle = stage >= 5 ? '#e7f5ea' : '#fff2df'; ctx.strokeStyle = stage >= 5 ? '#7cbd91' : '#d9a668'; ctx.beginPath(); ctx.roundRect(p.x, p.y, 91, 24, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = stage >= 5 ? '#2b6d45' : '#985e28'; ctx.font = '700 9px Inter, sans-serif'; ctx.fillText(stage >= 5 ? 'SKEPTIC CLEARED' : 'RISK FLAG · $9.8k', p.x + 8, p.y + 15) }
      const dial = project({ x: 426, y: 65 }); ctx.beginPath(); ctx.arc(dial.x, dial.y, 27, 0, Math.PI * 2); ctx.fillStyle = '#f2f8f2'; ctx.fill(); ctx.strokeStyle = '#8dbc9d'; ctx.stroke(); ctx.beginPath(); ctx.arc(dial.x, dial.y, 20, -.5 * Math.PI, (stage >= 6 ? 1.38 : stage >= 4 ? .84 : -.5) * Math.PI); ctx.strokeStyle = '#297047'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#225e3c'; ctx.font = '700 13px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(stage >= 6 ? '94' : stage >= 4 ? '82' : '—', dial.x, dial.y + 4); ctx.textAlign = 'left'
      ctx.fillStyle = '#a4c5ad'; ctx.font = '700 9px Inter, sans-serif'; ctx.fillText(`REVIEW STAGE ${String(stage).padStart(2, '0')} / 06`, project({ x: 18, y: 23 }).x, project({ x: 18, y: 23 }).y)
    }
    drawRef.current = () => draw(timeRef.current)
  }, [])

  useEffect(() => { if (reducedRef.current) drawRef.current?.() }, [active])

  return <figure ref={hostRef} className="auth-canvas-scene" aria-labelledby="canvas-caption"><canvas ref={canvasRef} aria-label="Animated Bank to Ledger to Board review scene" role="img" /><figcaption id="canvas-caption" className="canvas-readout" aria-live="polite">Bank → Ledger → Board · stage {active} of 6</figcaption><div className="canvas-hotspots" aria-label="Jump to a review stage"><button type="button" onClick={() => onSelectStage(3)} aria-label="Jump to Inspect stage">Inspect</button><button type="button" onClick={() => onSelectStage(4)} aria-label="Jump to Challenge stage">Challenge</button><button type="button" onClick={() => onSelectStage(6)} aria-label="Jump to Decide stage">Decide</button></div></figure>
}
