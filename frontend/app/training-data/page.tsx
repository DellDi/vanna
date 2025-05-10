'use client'

import { useState, useEffect } from 'react'
import { Download, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sidebar } from '@/components/layout/sidebar'
import { TrainingDataTable } from '@/components/training/training-data-table'
import { AddTrainingDataForm } from '@/components/training/add-training-data-form'
import Loading from './loading'
import { useTrainList } from '@/hooks/train/useTrainList'

export default function TrainingDataManagement() {
  const { trainList, loading, fetchData } = useTrainList()
  const [searchQuery, setSearchQuery] = useState('')
  // 过滤后的训练数据
  const filteredData = trainList.filter((item) => {
    let hasQuestion = false
    let hasContent = false
    if (item.question) {
      hasQuestion = item.question
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    }
    if (item.content) {
      hasContent = item.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    }
    return hasQuestion || hasContent
  })

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <Sidebar currentPage="training" />

      {/* 主要内容 */}
      <div className="flex-1 flex flex-col">
        <div className="border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">训练数据</h1>
              <Badge variant="outline" className="ml-2">
                {filteredData.length} 条
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索..."
                  className="w-[200px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter size={14} className="mr-1" />
                筛选
              </Button>
              <Button variant="outline" size="sm">
                <Download size={14} className="mr-1" />
                导出
              </Button>
              <AddTrainingDataForm onSuccess={fetchData} />
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <Loading />
          ) : (
            <TrainingDataTable data={filteredData} onDataChange={fetchData} />
          )}
        </div>
      </div>
    </div>
  )
}
