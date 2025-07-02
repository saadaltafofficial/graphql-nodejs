import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { fromHex } from "@cosmjs/encoding";
import dotenv from "dotenv";
dotenv.config();

// Array of private keys (hex strings) from .env, comma-separated
const privateKeysHex = process.env.PRIVATE_KEYS.split(",").map(k => k.trim());

const rpcEndpoint = process.env.RPC_ENDPOINT;
const prefix = process.env.PREFIX;
const contractAddress = process.env.CONTRACT_ADDRESS;

// Helper to get a random integer between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to get a random amount (1-2 ZIGs, in micro units)
function getRandomAmount() {
  return getRandomInt(0.01 * 100, 2 * 100) * 10_000; // 0.01 to 2 ZIGs, step 0.01
}

// Helper to get a random private key from the array
function getRandomPrivateKey() {
  const idx = getRandomInt(0, privateKeysHex.length - 1);
  return privateKeysHex[idx];
}

async function swapWithRandomWallet() {
  const privateKeyHex = getRandomPrivateKey();
  const privateKey = fromHex(privateKeyHex);
  const wallet = await DirectSecp256k1Wallet.fromKey(privateKey, prefix);
  const [account] = await wallet.getAccounts();
  const sender = account.address;

  // Optionally log balance
  // const client_balance = await StargateClient.connect(rpcEndpoint);
  // const balance = await client_balance.getAllBalances(sender);
  // console.log("Sender:", sender, "Balances:", balance);

  const amount = getRandomAmount();
  console.log(`Using wallet: ${sender}, Amount: ${amount}`);

  const client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, wallet, {
    gasPrice: GasPrice.fromString("0.00025uzig"),
  });

  const msg = {
    swap: {
      offer_asset: {
        info: {
          native_token: {
            denom: "uzig",
          },
        },
        amount: `${amount}`,
      },
      belief_price: "1",
      max_spread: "0.01",
    },
  };

  const funds = [
    {
      denom: "uzig",
      amount: `${amount}`,
    },
  ];

  try {
    const result = await client.execute(sender, contractAddress, msg, "auto", "Swap", funds);
    console.log("✅ Swap successful! TX hash:", result.transactionHash);
  } catch (error) {
    console.error("❌ Swap failed:", error);
  }
}

// Run swapWithRandomWallet every 5 seconds
setInterval(() => {
  swapWithRandomWallet();
}, 10000);
setInterval(() => {
  swapWithRandomWallet();
}, 10000);

