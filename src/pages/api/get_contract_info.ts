import getContractInfo from '@/utils/contract_info'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        if (req.method === "POST") {
            // Извлекаем данные из тела запроса
            const { chainId, contractAddresses } = req.body;

            // Проверяем, что chainId и contractAddresses переданы
            if (!chainId || !contractAddresses || !Array.isArray(contractAddresses)) {
                return res.status(400).json({ error: "Invalid request body. Expected { chainId: number, contractAddresses: string[] }" });
            }

            // Получаем информацию о контрактах
            const info = await getContractInfo(chainId, contractAddresses);

            // Возвращаем результат
            return res.status(200).json(info);
        } else {
            // Если метод не POST, возвращаем ошибку
            return res.status(405).json({ error: "Method not allowed. Use POST." });
        }
    } catch (error) {
        console.error("Error in handler:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}