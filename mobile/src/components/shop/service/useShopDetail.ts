import { useEffect, useState } from "react"
import { ShopService } from "./shopService"
import { useAuth } from "../../../context/AuthContext"

export const useShopDetail = () => {
    const { user } = useAuth()
    const [shop, setShop] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchShop = async () => {
        if (!user?.id) return
        try {
            setLoading(true)
            const res = await ShopService.getMyShop(user.id)
            setShop(res)
        } catch (e) {
            console.error("");
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchShop()
    }, [user?.id])

    return { shop, loading, actions: { refresh: fetchShop } }
}