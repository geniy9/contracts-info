import {JsonRpcProvider, Contract, getAddress} from 'ethers'
import {readFile} from 'fs/promises'


interface Chain {
    id: number;
    name: string;
    symbol: string;
    coin: string;
    rps: string[];
}

interface ContractInfo {
    name: string;
    symbol: string;
}
type ContractData = Record<string, ContractInfo>;

// ABI для ERC20 контракта (только необходимые методы)
const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];



async function getRpcData(chainId: number): Promise<Chain | null> {
    try{
        const file = await readFile('rpc.json', {
            encoding: 'utf-8', flag: 'r'
        })
        const data: Chain[] = JSON.parse(file)
        const res =  data.find(item => item.id == chainId)
        if( res)
            return res
    }catch (err){
        console.error("file parse error:", err)
    }
    return null;
}

function checkSumAddress(adreses: string[]): string[]{
    const result: string[] = []
    for (const key of adreses) {
        try{
            result.push(getAddress(key))
        }catch (err){
            console.log("invalid address: ", key, err)
        }
    }
    return result;
}

// Функция для получения информации о контракте
// export default async function getContractInfo(chainId: number, contractAddresess: string[]): Promise<ContractData | null> {
//     try {
//         const rpc: Chain | null = await getRpcData(chainId)
//         if (rpc == null)
//             return null
//         // Подключение к Ethereum Mainnet через Infura
//         const provider = new JsonRpcProvider(rpc.rps[Math.floor(Math.random() * rpc.rps.length)], rpc.id);
//         const validAdresess = checkSumAdress(contractAddresess)
//         // Создание экземпляра контракта
//         const contract = new Contract(getAddress(contractAddress), erc20Abi, provider);
//         const name = await contract.name();
//         const symbol = await contract.symbol();

//         return {
//             name,
//             symbol
//         }
//     } catch (error) {
//         console.error("Error fetching contract info:", error);
//     }
// }

export default async function getContractInfo(chainId: number, contractAddresses: string[]): Promise<ContractData | null> {
    try {
        const rpc: Chain | null = await getRpcData(chainId);
        if (rpc == null)
            return null;

        // Подключение к Ethereum Mainnet через Infura
        const provider = new JsonRpcProvider(rpc.rps[Math.floor(Math.random() * rpc.rps.length)], rpc.id);
        const validAddresses = checkSumAddress(contractAddresses);

        // Создание массива промисов для каждого контракта
        const contractPromises = validAddresses.map(async (address) => {
            const contract = new Contract(address, erc20Abi, provider);
            try {
                const name = await contract.name();
                const symbol = await contract.symbol();
                return { address, name, symbol };
            } catch (error) {
                console.error(`Error fetching info for contract ${address}:`, error);
                return { address, name: 'Unknown', symbol: 'Unknown' };
            }
        });

        // Ожидание завершения всех промисов
        const results = await Promise.all(contractPromises);

        // Преобразование результатов в объект ContractData
        const contractData: ContractData = {};
        results.forEach(result => {
            contractData[result.address] = { name: result.name, symbol: result.symbol };
        });

        return contractData;
    } catch (error) {
        console.error("Error fetching contract info:", error);
        return null;
    }
}