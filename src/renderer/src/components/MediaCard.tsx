import { useNavigate } from 'react-router-dom'
import { Play, Star } from 'lucide-react'
import { MediaItem } from '../types'
import './MediaCard.css'

interface MediaCardProps {
  item: MediaItem
  /** 是否为大卡片（继续观看行） */
  large?: boolean
  /** 动画延迟索引 */
  index?: number
}

/** 视频卡片组件 */
export default function MediaCard({ item, large = false, index = 0 }: MediaCardProps): JSX.Element {
  const navigate = useNavigate()

  /** 计算播放进度百分比 */
  const progressPercent = item.progress
    ? Math.round((item.progress.currentTime / item.progress.totalDuration) * 100)
    : 0

  /** 格式化副标题 */
  const subtitle = (): string => {
    if (item.type === 'tvshow' && item.seasons) {
      return `共${item.seasons.length}季`
    }
    return item.releaseDate || item.dateAdded || ''
  }

  return (
    <div
      className={`media-card ${large ? 'large' : ''}`}
      onClick={() => navigate(`/detail/${item.id}`)}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="media-card-poster">
        <img
          className="media-card-img"
          src={large && item.backdrop ? item.backdrop : item.poster}
          alt={item.title}
          loading="lazy"
          onError={(e) => {
            // 图片加载失败时使用渐变占位
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />

        {/* 悬停叠加层 */}
        <div className="media-card-overlay">
          <div className="media-card-play-btn">
            <Play size={22} fill="currentColor" />
          </div>
        </div>

        {/* 评分标签 */}
        {item.rating && !large && (
          <div className="media-card-rating">
            <Star size={10} fill="currentColor" />
            {item.rating.toFixed(1)}
          </div>
        )}

        {/* 播放进度条 */}
        {item.progress && progressPercent > 0 && (
          <div className="media-card-progress">
            <div className="media-card-progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      <div className="media-card-info">
        <div className="media-card-title">{item.title}</div>
        <div className="media-card-subtitle">{subtitle()}</div>
      </div>
    </div>
  )
}
