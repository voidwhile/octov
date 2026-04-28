import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MediaItem } from '../types'
import MediaCard from './MediaCard'
import './MediaRow.css'

interface MediaRowProps {
  title: string
  items: MediaItem[]
  /** "查看全部" 链接 */
  viewAllLink?: string
  /** 是否使用大卡片 */
  large?: boolean
}

/** 横向滚动媒体列表行 */
export default function MediaRow({
  title,
  items,
  viewAllLink,
  large = false
}: MediaRowProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  /** 检查滚动状态 */
  const checkScroll = (): void => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      // 监听窗口大小变化
      const observer = new ResizeObserver(checkScroll)
      observer.observe(el)
      return () => {
        el.removeEventListener('scroll', checkScroll)
        observer.disconnect()
      }
    }
  }, [items])

  /** 滚动方向 */
  const scroll = (direction: 'left' | 'right'): void => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.8
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  if (items.length === 0) return <></>

  return (
    <section className="media-row">
      <div className="media-row-header">
        <h2 className="media-row-title">{title}</h2>
        {viewAllLink && (
          <Link to={viewAllLink} className="media-row-action">
            查看全部
          </Link>
        )}
      </div>

      <div className="media-row-scroll-wrapper">
        {/* 左箭头 */}
        <button
          className="media-row-arrow left"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
        >
          <ChevronLeft size={18} />
        </button>

        {/* 滚动容器 */}
        <div className="media-row-scroll" ref={scrollRef}>
          {items.map((item, index) => (
            <MediaCard key={item.id} item={item} large={large} index={index} />
          ))}
        </div>

        {/* 右箭头 */}
        <button
          className="media-row-arrow right"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  )
}
