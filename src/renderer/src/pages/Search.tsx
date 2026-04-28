import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { searchLibrary } from '../data/mediaLibrary'
import MediaCard from '../components/MediaCard'
import { Search } from 'lucide-react'
import './Movies.css' // 复用网格样式

/** 搜索结果页面 */
export default function SearchPage(): JSX.Element {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchLibrary(query)
  }, [query])

  return (
    <div className="media-grid-page">
      <div className="media-grid-page-header">
        <h2 className="media-grid-page-title">
          搜索：{query}
          <span className="media-grid-page-count">{results.length} 个结果</span>
        </h2>
      </div>

      {results.length > 0 ? (
        <div className="media-grid">
          {results.map((item, index) => (
            <MediaCard key={item.id} item={item} index={index} />
          ))}
        </div>
      ) : (
        <div className="media-row-empty" style={{ height: '300px', flexDirection: 'column', display: 'flex', gap: '12px' }}>
          <Search size={48} style={{ opacity: 0.3 }} />
          <span>{query ? '未找到匹配的结果' : '请输入搜索关键词'}</span>
        </div>
      )}
    </div>
  )
}
