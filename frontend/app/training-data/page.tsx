"use client"

import { useState, useEffect } from "react"
import { Download, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/layout/sidebar"
import { TrainingDataTable } from "@/components/training/training-data-table"
import { AddTrainingDataForm } from "@/components/training/add-training-data-form"
import { TrainingData } from "@/lib/types"
import { getTrainingDataAction } from "@/lib/actions"
import { toast } from "sonner"

export default function TrainingDataManagement() {
  const [trainingData, setTrainingData] = useState<TrainingData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // 过滤后的训练数据
  const filteredData = trainingData.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 获取训练数据
  const fetchTrainingData = async () => {
    try {
      setLoading(true)
      const response = await getTrainingDataAction()
      
      // 将JSON字符串解析为对象数组
      const data = JSON.parse(response.df) as TrainingData[]
      setTrainingData(data)
    } catch (error) {
      console.error('获取训练数据失败:', error)
      toast.error('获取训练数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    fetchTrainingData()
  }, [])

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
              <AddTrainingDataForm onSuccess={fetchTrainingData} />
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">加载中...</p>
              </div>
            </div>
          ) : (
            <TrainingDataTable 
              data={filteredData} 
              onDataChange={fetchTrainingData} 
            />
          )}
        </div>
      </div>
    </div>
  )
}
