import { useState, useEffect, useCallback, useRef } from 'react'
import { getTrainingDataAction } from '@/lib/actions'
import { TrainingData } from '@/lib/types'
import { toast } from 'sonner'

interface UseTrainListOptions {
    /**
     * 是否在组件挂载时自动加载数据
     * @default true
     */
    autoLoad?: boolean;

    /**
     * 自定义错误处理函数
     */
    onError?: (error: unknown) => void;
}

/**
 * 训练数据列表 Hook
 *
 * @example
 * // 自动加载数据（默认行为）
 * const { trainList, loading, refresh } = useTrainList();
 *
 * @example
 * // 手动控制数据加载
 * const { trainList, loading, fetchData } = useTrainList({ autoLoad: false });
 *
 * // 在需要的时候加载数据
 * const handleLoadData = () => {
 *   fetchData();
 * };
 */
export function useTrainList(options: UseTrainListOptions = { autoLoad: true }) {
    const { autoLoad = true, onError } = options;
    // 将 loading 初始值设置为 false，避免阻止首次加载
    const [loading, setLoading] = useState(true)
    const [trainList, setTrainList] = useState<TrainingData[]>([])

    // 使用 useRef 来跟踪是否正在加载，避免闭包问题
    const isLoadingRef = useRef(false);

    // 使用 useCallback 包装请求函数，避免不必要的重新创建
    const fetchData = useCallback(async () => {
        // 使用 ref 检查是否正在加载，而不是依赖 loading 状态
        if (isLoadingRef.current) return []; // 防止重复请求

        isLoadingRef.current = true;
        setLoading(true);

        try {
            const response = await getTrainingDataAction()
            if (response && response.df) {
                // 将JSON字符串解析为对象数组
                const data = JSON.parse(response.df) as TrainingData[]
                setTrainList(data)
                return data; // 返回数据，方便链式调用
            }
            return [];
        } catch (error) {
            console.error('获取训练数据失败:', error)
            toast.error('获取训练数据失败')
            // 如果提供了自定义错误处理函数，则调用
            if (onError) {
                onError(error);
            }
            return [];
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
        }
    }, [onError]) // 只依赖 onError，不依赖 loading

    // 刷新数据的别名函数，语义更清晰
    const refresh = useCallback(() => fetchData(), [fetchData])

    // 清空数据
    const clearData = useCallback(() => {
        setTrainList([]);
    }, [])

    // 仅在组件挂载且 autoLoad 为 true 时自动加载数据
    useEffect(() => {
        if (autoLoad) {
            fetchData()
        }
    }, [autoLoad, fetchData])

    return {
        setTrainList, // 设置训练数据列表
        trainList,  // 训练数据列表
        loading,    // 加载状态
        fetchData,  // 获取数据函数
        refresh,    // 刷新数据（fetchData 的别名）
        clearData,  // 清空数据
        isEmpty: trainList.length === 0 // 数据是否为空的便捷判断
    }
}