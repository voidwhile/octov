import { useState, useMemo, useEffect } from 'react'
import { getLibraryTVShows, onScanChange } from '../data/mediaLibrary'
import MediaCard from '../components/MediaCard'
import { SortBy } from '../types'
import './Movies.css' // 复用 Movies 样式

/** 全部类型列表 */
const ALL_GENRES = ['全部', '犯罪', '剧情', '喜剧', '纪录片', '自然', '奇幻', '冒险', '惊悚']

/** 电视剧列表页 */
export default function TVShows(): JSX.Element {
  const [activeGenre, setActiveGenre] = useState('全部')
  const [sortBy, setSortBy] = useState<SortBy>('dateAdded')
  const [, setRefresh] = useState(0)

  useEffect(() => {
    return onScanChange(() => setRefresh(n => n + 1))
  }, [])

  const tvshows = useMemo(() => {
    let list = getLibraryTVShows()

    // 类型筛选
    if (activeGenre !== '全部') {
      list = list.filter((m) => m.genres?.includes(activeGenre))
    }

    // 排序
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title, 'zh-CN')
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'releaseDate':
          return new Date(b.releaseDate || '').getTime() - new Date(a.releaseDate || '').getTime()
        case 'dateAdded':
        default:
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      }
    })

    return list
  }, [activeGenre, sortBy])

  return (
    <div className="media-grid-page">
      <div className="media-grid-page-header">
        <h2 className="media-grid-page-title">
          电视剧
          <span className="media-grid-page-count">{tvshows.length} 部</span>
        </h2>
      </div>

      {/* 筛选栏 */}
      <div className="media-grid-filters">
        {ALL_GENRES.map((genre) => (
          <button
            key={genre}
            className={`media-grid-filter-chip ${activeGenre === genre ? 'active' : ''}`}
            onClick={() => setActiveGenre(genre)}
          >
            {genre}
          </button>
        ))}

        <div className="media-grid-sort">
          <span>排序：</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="dateAdded">添加日期</option>
            <option value="releaseDate">首播日期</option>
            <option value="name">名称</option>
            <option value="rating">评分</option>
          </select>
        </div>
      </div>

      {/* 网格 */}
      <div className="media-grid">
        {tvshows.map((show, index) => (
          <MediaCard key={show.id} item={show} index={index} />
        ))}
      </div>

      {tvshows.length === 0 && (
        <div className="media-row-empty">暂无匹配的电视剧</div>
      )}
    </div>
  )
}
