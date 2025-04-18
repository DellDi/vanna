/**
 * 添加训练数据表单组件
 */
"use client"

import { useState } from "react"
import { TrainRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { addTrainingDataAction } from "@/lib/actions"
import { toast } from "sonner"

interface AddTrainingDataFormProps {
  onSuccess?: () => void
}

export function AddTrainingDataForm({ onSuccess }: AddTrainingDataFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("sql")
  const [formData, setFormData] = useState<TrainRequest>({
    question: "",
    sql: "",
    ddl: "",
    documentation: ""
  })

  const handleChange = (field: keyof TrainRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      // 根据当前活动的标签确定要提交的数据
      const dataToSubmit: TrainRequest = {
        question: formData.question
      }
      
      if (activeTab === "sql") {
        dataToSubmit.sql = formData.sql
      } else if (activeTab === "ddl") {
        dataToSubmit.ddl = formData.ddl
      } else if (activeTab === "documentation") {
        dataToSubmit.documentation = formData.documentation
      }
      
      await addTrainingDataAction(dataToSubmit)
      toast.success("训练数据添加成功")
      
      // 重置表单
      setFormData({
        question: "",
        sql: "",
        ddl: "",
        documentation: ""
      })
      
      setOpen(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("添加训练数据失败:", error)
      toast.error("添加训练数据失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} className="mr-1" />
          添加训练数据
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>添加训练数据</DialogTitle>
          <DialogDescription>
            添加新的训练数据以提高模型的准确性。您可以添加问题与SQL查询、DDL语句或文档内容。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium">
              问题 <span className="text-muted-foreground">(可选)</span>
            </label>
            <Input
              id="question"
              placeholder="输入自然语言问题..."
              value={formData.question}
              onChange={(e) => handleChange("question", e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="sql" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="sql">SQL 查询</TabsTrigger>
              <TabsTrigger value="ddl">DDL 语句</TabsTrigger>
              <TabsTrigger value="documentation">文档内容</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sql" className="space-y-2">
              <label htmlFor="sql" className="text-sm font-medium">
                SQL 查询
              </label>
              <Textarea
                id="sql"
                placeholder="输入SQL查询..."
                className="font-mono h-40"
                value={formData.sql}
                onChange={(e) => handleChange("sql", e.target.value)}
              />
            </TabsContent>
            
            <TabsContent value="ddl" className="space-y-2">
              <label htmlFor="ddl" className="text-sm font-medium">
                DDL 语句
              </label>
              <Textarea
                id="ddl"
                placeholder="输入DDL语句..."
                className="font-mono h-40"
                value={formData.ddl}
                onChange={(e) => handleChange("ddl", e.target.value)}
              />
            </TabsContent>
            
            <TabsContent value="documentation" className="space-y-2">
              <label htmlFor="documentation" className="text-sm font-medium">
                文档内容
              </label>
              <Textarea
                id="documentation"
                placeholder="输入文档内容..."
                className="h-40"
                value={formData.documentation}
                onChange={(e) => handleChange("documentation", e.target.value)}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "添加中..." : "添加训练数据"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
