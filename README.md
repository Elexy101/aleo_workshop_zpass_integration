# aleo_workshop_zpass_integration
Aleo ZPass is a zero-knowledge proof-based digital identity system that allows users to prove their credentials (such as nationality, date of birth, or other personal details) without revealing sensitive information. It is built on the Aleo blockchain, leveraging zero-knowledge proofs (ZKPs) for privacy-preserving identity verification.

# DEPLOYMENT
DEPLOYMENT ID: at1r9c03cac7h4r59vnpu5e2trupmp3um5zv8xsnkgk2uxyac6n45xs53z0pd

DEPLOYMENT URL: https://testnet.aleo.info/program/verify_poseidon2_zpass_elexy.aleo

# TESTING WITH EXAMPLE

- Clone this repository
- cd into examples/
- Install dependencies:

```
npm install
```

- Set up local devnet:
Clone snarkOS
Start local devnet in mainnet mode:

```
./devnet
```

- Follow instructions and select mainnet when prompted
- Deploy verify_poseidon2_zpass program to local devnet:

```
cd programs/verify_poseidon2_zpass_elexy
leo deploy --network testnet --endpoint "https://api.explorer.provable.com/v1" --private-key "APtivate1..."
```

leo deploy # Uses .env.example with validator 0's private key
Note: The validator 0's private key in .env.example has test tokens for local devnet


# Start the example:
```
cd ..
npm run dev
```
Open the example in your browser and follow the instructions
Pull up the console and see the logs
