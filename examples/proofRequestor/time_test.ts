import { hrtime } from "node:process";

import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
// import { arbitrum } from 'viem/chains';

import { defineChain } from "viem";

export const zora = defineChain({
  id: 987,
  name: "Zora",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://localhost:8545"],
      webSocket: ["wss://localhost:8546"],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.zora.energy" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 5882,
    },
  },
});

async function main() {
  // console.log({arbitrum});
  const client = createWalletClient({
    pollingInterval: 100,
    chain: zora,
    transport: http("http://localhost:8545"),
  });

  const pclient = createPublicClient({
    pollingInterval: 100,
    chain: zora,
    transport: http("http://localhost:8545"),
  });

  const chainId = await client.getChainId();

  console.log(chainId);

  const account = privateKeyToAccount(
    "0xfece7040774399021887f602d04175d9ae60eb01ec47fb5c8f748120db190fa7"
  );

  const start = hrtime.bigint();

  const hash = await client.sendTransaction({
    account,
    to: "0x9c29f9BF22327a125D9c043E775efE4AaAE40360",
  });
  await pclient.waitForTransactionReceipt({ hash: hash });

  const end = hrtime.bigint();

  console.log(end - start);

  return "Done";
}

main().then(console.log).catch(console.log);
