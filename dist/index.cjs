"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  HashAlgorithm: () => import_zpass_credential_signer.HashAlgorithm,
  SDKError: () => SDKError,
  ZPassSDK: () => ZPassSDK,
  createAleoWorker: () => createAleoWorker,
  expose: () => import_comlink2.expose
});
module.exports = __toCommonJS(index_exports);

// src/interfaces/index.ts
var import_zpass_credential_signer = require("zpass-credential-signer");

// src/errors/index.ts
var SDKError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "SDKError";
  }
};

// src/core/createAleoWorker.ts
var import_comlink = require("comlink");
var singletonWorker;
var createAleoWorker = ({ url, baseUrl }) => {
  if (!singletonWorker) {
    const worker = new Worker(new URL(url, baseUrl), {
      type: "module"
    });
    worker.onerror = function(event) {
      console.error("Error in worker: " + event?.message);
    };
    singletonWorker = (0, import_comlink.wrap)(worker);
  }
  return singletonWorker;
};

// src/index.ts
var import_comlink2 = require("comlink");

// src/core/sdk.ts
var wasm = __toESM(require("zpass-credential-signer"), 1);
var mainnetSDK = __toESM(require("@provablehq/sdk/mainnet.js"), 1);
var testnetSDK = __toESM(require("@provablehq/sdk/testnet.js"), 1);
var ZPassSDK = class {
  async getSDKModules() {
    return {
      Account: this.sdk.Account,
      OfflineQuery: this.sdk.OfflineQuery,
      initThreadPool: this.sdk.initThreadPool
    };
  }
  constructor({ privateKey, host, network = "mainnet" }) {
    if (typeof WebAssembly === "undefined") {
      throw new SDKError("WebAssembly is not supported in this environment. ZPassSDK requires WebAssembly support.");
    }
    if (!privateKey.startsWith("APrivateKey1")) {
      throw new SDKError('Invalid private key format. Private key must start with "APrivateKey1"');
    }
    if (network === "mainnet") {
      this.sdk = mainnetSDK;
      const { Account, ProgramManager, AleoKeyProvider, NetworkRecordProvider, AleoNetworkClient } = this.sdk;
      try {
        const account = new Account({ privateKey });
        host = host ? host : "https://api.explorer.provable.com/v1";
        this.programManager = new ProgramManager(host);
        this.networkClient = new AleoNetworkClient(host, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        this.keyProvider = new AleoKeyProvider();
        this.recordProvider = new NetworkRecordProvider(account, this.networkClient);
        this.programManager.setAccount(account);
        this.programManager.setKeyProvider(this.keyProvider);
        this.programManager.setRecordProvider(this.recordProvider);
        this.lastProgram = null;
        this.network = wasm.Network.Mainnet;
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        throw new SDKError(`Error initializing SDK: ${message}`);
      }
    } else {
      this.sdk = testnetSDK;
      const { Account, ProgramManager, AleoKeyProvider, NetworkRecordProvider, AleoNetworkClient } = this.sdk;
      try {
        const account = new Account({ privateKey });
        host = host ? host : "https://api.explorer.provable.com/v1";
        this.programManager = new ProgramManager(host);
        this.networkClient = new AleoNetworkClient(host, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        this.keyProvider = new AleoKeyProvider();
        this.recordProvider = new NetworkRecordProvider(account, this.networkClient);
        this.programManager.setAccount(account);
        this.programManager.setKeyProvider(this.keyProvider);
        this.programManager.setRecordProvider(this.recordProvider);
        this.lastProgram = null;
        this.network = wasm.Network.Testnet;
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        throw new SDKError(`Error initializing SDK: ${message}`);
      }
    }
  }
  async getMerkleRoot(inputs) {
    const root = wasm.get_merkle_root(inputs, this.network);
    return root;
  }
  async getMerkleTree(inputs) {
    const proof = wasm.get_merkle_tree(inputs, this.network);
    return proof;
  }
  async getMerkleProof(inputs, index) {
    const proof = wasm.get_merkle_proof(inputs, index, this.network);
    return proof;
  }
  async getLeavesHashes(inputs) {
    const hashes = wasm.hash_to_fields_size_8(inputs, this.network);
    return hashes;
  }
  async signMerkleRoot(root) {
    const privateKey = this.programManager.account?.privateKey()?.to_string();
    if (!privateKey) {
      throw new SDKError("Private key is not available");
    }
    const proof = wasm.sign_merkle_root(privateKey, root, this.network);
    return proof;
  }
  setNewHost(host) {
    this.programManager.setHost(host);
  }
  async signCredential(options) {
    const { data, hashType, privateKey } = options;
    const msg = new wasm.SignInboundMessage(data);
    const privateKeyToUse = privateKey ?? this.programManager.account?.privateKey()?.to_string();
    if (!privateKeyToUse) {
      throw new SDKError("Private key is not available");
    }
    const { signature, hash } = wasm.sign_message(privateKeyToUse, msg, hashType, this.network);
    return {
      signature,
      hash
    };
  }
  async issueZPass(options) {
    return this.onChainInteract(options);
  }
  async getZPassRecord(transactionId) {
    const { RecordCiphertext } = this.sdk;
    const tx = await this.networkClient.getTransaction(transactionId);
    const outputs = tx.execution?.transitions?.[0].outputs;
    if (!outputs) {
      throw new SDKError("No outputs found in transaction");
    }
    const recordOutput = outputs.find((output) => output.type === "record");
    if (!recordOutput) {
      throw new SDKError("No record found in transaction outputs");
    }
    const record = recordOutput.value;
    const recordCiphertext = RecordCiphertext.fromString(record);
    const viewKey = this.programManager.account?.viewKey();
    if (!viewKey) {
      throw new SDKError("View key is not available");
    }
    const recordPlaintext = recordCiphertext.decrypt(viewKey);
    return recordPlaintext.toString();
  }
  async proveOnChain(options) {
    return this.onChainInteract(options);
  }
  async proveOffChain(options) {
    const { localProgram, functionName, inputs, offlineQuery } = options;
    const { AleoKeyProviderParams } = this.sdk;
    const program = this.programManager.createProgramFromSource(localProgram);
    const program_id = program.id();
    if (!program.hasFunction(functionName)) {
      throw `Program ${program_id} does not contain function ${functionName}`;
    }
    const cacheKey = `${program_id}:${functionName}`;
    const imports = await this.networkClient.getProgramImports(localProgram);
    if (this.lastProgram !== localProgram) {
      const keys = await this.programManager.synthesizeKeys(
        localProgram,
        functionName,
        inputs,
        this.programManager.account?.privateKey()
      );
      this.keyProvider.cacheKeys(cacheKey, keys);
      this.lastProgram = localProgram;
    }
    const keyParams = new AleoKeyProviderParams({
      cacheKey
    });
    const response = await this.programManager.run(
      localProgram,
      functionName,
      inputs,
      true,
      imports,
      keyParams,
      this.keyProvider.getKeys(cacheKey)[0],
      this.keyProvider.getKeys(cacheKey)[1],
      this.programManager.account?.privateKey(),
      offlineQuery
    );
    const outputs = response.getOutputs();
    const execution = response.getExecution()?.toString();
    const verifyingKey = response.getVerifyingKey()?.toString();
    return {
      outputs,
      execution,
      verifyingKey
    };
  }
  static async verifyOnChain(options) {
    const { transactionId, url, network } = options;
    let sdkModule = network === "mainnet" ? mainnetSDK : testnetSDK;
    const { AleoNetworkClient } = sdkModule;
    const baseUrl = !url ? "https://api.explorer.provable.com/v1" : url;
    const networkClient = new AleoNetworkClient(baseUrl, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    const transaction = await networkClient.getTransaction(transactionId);
    console.log("Transaction:", transaction);
    const hasExecution = transaction.type === "execute" ? true : false;
    const outputs = transaction.execution?.transitions?.[0].outputs;
    return {
      hasExecution,
      outputs: outputs ?? []
    };
  }
  static async verifyOffChain(options) {
    const { execution, program, functionName, inputs, verifyingKey, url, network } = options;
    let sdkModule = network === "mainnet" ? mainnetSDK : testnetSDK;
    const { ProgramManager, AleoKeyProvider, verifyFunctionExecution, FunctionExecution, VerifyingKey, Program } = sdkModule;
    if (!inputs && !verifyingKey) {
      throw new SDKError("Either inputs or verifyingKey must be provided");
    }
    let verifyingKeyToUse;
    if (!verifyingKey && inputs) {
      const programManager = new ProgramManager(url, new AleoKeyProvider());
      const keys = await programManager.synthesizeKeys(
        program,
        functionName,
        inputs
      );
      verifyingKeyToUse = keys[1].toString();
    } else {
      verifyingKeyToUse = verifyingKey;
    }
    const res = verifyFunctionExecution(
      FunctionExecution.fromString(execution),
      VerifyingKey.fromString(verifyingKeyToUse),
      Program.fromString(program),
      functionName
    );
    return res;
  }
  async onChainInteract(options) {
    const { programName, functionName, inputs, privateFee, fee, feeRecord } = options;
    const { AleoKeyProviderParams } = this.sdk;
    const program = await this.networkClient.getProgram(programName);
    const cacheKey = `${programName}:${functionName}`;
    if (this.lastProgram !== program) {
      const keys = await this.programManager.synthesizeKeys(
        program,
        functionName,
        inputs,
        this.programManager.account?.privateKey()
      );
      this.keyProvider.cacheKeys(cacheKey, keys);
      this.lastProgram = program;
    }
    const keyParams = new AleoKeyProviderParams({
      cacheKey
    });
    const transaction = await this.programManager.buildExecutionTransaction({
      programName,
      functionName,
      fee,
      privateFee,
      inputs,
      feeRecord,
      program,
      keySearchParams: keyParams,
      provingKey: this.keyProvider.getKeys(cacheKey)[0],
      verifyingKey: this.keyProvider.getKeys(cacheKey)[1]
    });
    await this.networkClient.submitTransaction(transaction);
    return transaction.id();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HashAlgorithm,
  SDKError,
  ZPassSDK,
  createAleoWorker,
  expose
});
//# sourceMappingURL=index.cjs.map