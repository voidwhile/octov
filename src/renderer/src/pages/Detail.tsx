import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Star, Clock, Calendar } from 'lucide-react'
import { useState } from 'react'
import { getLibraryById } from '../data/mediaLibrary'
import './Detail.css'

/** 视频详情页 */
export default function Detail(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeSeason, setActiveSeason] = useState(0)

  const item = getLibraryById(id || '')

  if (!item) {
    return (
      <div className="media-row-empty" style={{ height: '300px' }}>
        未找到该内容
      </div>
    )
  }

  /** 格式化时长 */
  const formatDuration = (mins: number): string => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
  }

  /** 播放视频 */
  const handlePlay = (cloudFileId?: string, name?: string): void => {
    if (cloudFileId) {
      // 提取父目录 ID：电视剧用文件夹 ID，电影用文件源路径
      let parentId = ''
      if (item.type === 'tvshow' && item.id.startsWith('cloud-tv-')) {
        parentId = item.id.replace('cloud-tv-', '')
      } else if (item.sourceId) {
        parentId = item.sourceId
      }
      const params = new URLSearchParams({ name: name || item.title })
      if (parentId) params.set('parentId', parentId)
      navigate(`/player/cloud/${cloudFileId}?${params.toString()}`, { state: { from: `/detail/${item.id}` } })
    } else {
      navigate(`/player/${item.id}`, { state: { from: `/detail/${item.id}` } })
    }
  }

  const currentSeason = item.seasons?.[activeSeason]

  return (
    <div className="detail-page">
      {/* 背景横幅 */}
      <div className="detail-backdrop">
        <button className="detail-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>

        {item.backdrop && (
          <img className="detail-backdrop-img" src={item.backdrop} alt="" />
        )}
        <div className="detail-backdrop-gradient" />
      </div>

      {/* 详情内容 */}
      <div className="detail-content">
        {/* 封面海报 */}
        <div className="detail-poster">
          <img src={item.poster} alt={item.title} />
        </div>

        {/* 信息区 */}
        <div className="detail-info">
          <h1 className="detail-title">{item.title}</h1>
          {item.originalTitle && item.originalTitle !== item.title && (
            <div className="detail-original-title">{item.originalTitle}</div>
          )}

          {/* 元数据 */}
          <div className="detail-meta">
            {item.rating && (
              <>
                <span className="detail-meta-item rating">
                  <Star size={14} fill="currentColor" />
                  {item.rating.toFixed(1)}
                </span>
                <span className="detail-meta-divider" />
              </>
            )}
            {item.year && (
              <>
                <span className="detail-meta-item">
                  <Calendar size={14} />
                  {item.year}
                </span>
                <span className="detail-meta-divider" />
              </>
            )}
            {item.duration && (
              <span className="detail-meta-item">
                <Clock size={14} />
                {formatDuration(item.duration)}
              </span>
            )}
            {item.type === 'tvshow' && item.seasons && (
              <span className="detail-meta-item">
                共{item.seasons.length}季
              </span>
            )}
          </div>

          {/* 类型标签 */}
          {item.genres && (
            <div className="detail-genres">
              {item.genres.map((genre) => (
                <span key={genre} className="detail-genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* 播放按钮 */}
          <div className="detail-actions">
            <button
              className="detail-play-btn"
              onClick={() => {
                // 电视剧没有 cloudFileId 时，播放第一集（集号最小的）
                let firstEp = item.seasons?.[0]?.episodes?.[0]
                if (item.seasons?.[0]?.episodes) {
                  const sorted = [...item.seasons[0].episodes].sort((a, b) => a.episodeNumber - b.episodeNumber)
                  firstEp = sorted[0]
                }
                const playFileId = item.cloudFileId || firstEp?.filePath
                const playName = item.cloudFileId ? item.title : firstEp?.name
                handlePlay(playFileId, playName)
              }}
            >
              <Play size={18} fill="currentColor" />
              {item.progress ? '继续播放' : '开始播放'}
            </button>
          </div>
        </div>
      </div>

      {/* 简介 */}
      {item.overview && (
        <div className="detail-overview">
          <h3>剧情简介</h3>
          <p>{item.overview}</p>
        </div>
      )}

      {/* 电视剧集列表 */}
      {item.type === 'tvshow' && item.seasons && item.seasons.length > 0 && (
        <div className="detail-episodes">
          <h3>剧集列表</h3>

          {/* 季选择 */}
          {item.seasons.length > 1 && (
            <div className="detail-season-tabs">
              {item.seasons.map((season, index) => (
                <button
                  key={season.seasonNumber}
                  className={`detail-season-tab ${activeSeason === index ? 'active' : ''}`}
                  onClick={() => setActiveSeason(index)}
                >
                  {season.name}
                </button>
              ))}
            </div>
          )}

          {/* 集列表 */}
          {currentSeason && (
            <div className="detail-episode-list">
              {[...currentSeason.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber).map((ep) => (
                <div
                  key={ep.episodeNumber}
                  className="detail-episode-item"
                  onClick={() => handlePlay(ep.filePath, ep.name)}
                >
                  <span className="detail-episode-number">{ep.episodeNumber}</span>
                  <div className="detail-episode-info">
                    <div className="detail-episode-name">{ep.name}</div>
                    {ep.duration && (
                      <div className="detail-episode-duration">{ep.duration} 分钟</div>
                    )}
                  </div>
                  <div className="detail-episode-play">
                    <Play size={16} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
