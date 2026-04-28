import { useState, useMemo, useEffect } from 'react'
import { getLibraryMovies, onScanChange } from '../data/mediaLibrary'
import MediaCard from '../components/MediaCard'
import { SortBy } from '../types'
import './Movies.css'

/** 全部类型列表 */
const ALL_GENRES = ['全部', '科幻', '动作', '剧情', '冒险', '犯罪', '惊悚', '战争', '历史', '奇幻', '爱情', '传记']

/** 电影列表页 */
export default function Movies(): JSX.Element {
  const [activeGenre, setActiveGenre] = useState('全部')
  const [sortBy, setSortBy] = useState<SortBy>('dateAdded')
  const [, setRefresh] = useState(0)

  // 监听扫描变化刷新数据
  useEffect(() => {
    return onScanChange(() => setRefresh(n => n + 1))
  }, [])

  const movies = useMemo(() => {
    let list = getLibraryMovies()

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
          电影
          <span className="media-grid-page-count">{movies.length} 部</span>
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
            <option value="releaseDate">上映日期</option>
            <option value="name">名称</option>
            <option value="rating">评分</option>
          </select>
        </div>
      </div>

      {/* 网格 */}
      <div className="media-grid">
        {movies.map((movie, index) => (
          <MediaCard key={movie.id} item={movie} index={index} />
        ))}
      </div>

      {movies.length === 0 && (
        <div className="media-row-empty">暂无匹配的电影</div>
      )}
    </div>
  )
}
