const { proto } = require("@whiskeysockets/baileys/WAProto");
const { Curve, signedKeyPair } = require("@whiskeysockets/baileys/lib/Utils/crypto");
const { generateRegistrationId } = require("@whiskeysockets/baileys/lib/Utils/generics");
const { randomBytes } = require("crypto");
const { performance } = require('perf_hooks');
const { EventEmitter } = require('events');

class AdvancedMongoAuthState extends EventEmitter {
  constructor(collection, options = {}) {
    super();
    this.collection = collection;
    this.logger = options.logger || console;
    this.cacheSize = options.cacheSize || 100;
    this.cacheTTL = options.cacheTTL || 300000; // 5 minutes
    this.cache = new Map();
    this.writeQueue = [];
    this.isWriting = false;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  async init() {
    this.creds = await this.readData("creds") || this.initAuthCreds();
    this.startWriteQueueProcessor();
    this.startCacheCleanup();
  }

  initAuthCreds() {
    const identityKey = Curve.generateKeyPair();
    return {
      noiseKey: Curve.generateKeyPair(),
      signedIdentityKey: identityKey,
      signedPreKey: signedKeyPair(identityKey, 1),
      registrationId: generateRegistrationId(),
      advSecretKey: randomBytes(32).toString("base64"),
      processedHistoryMessages: [],
      nextPreKeyId: 1,
      firstUnuploadedPreKeyId: 1,
      accountSettings: {
        unarchiveChats: false,
        autoUpdateStatus: true,
        statusMsgTemplate: "Hey there! I'm using Baileys.",
      },
      account: {
        details: "CaffeineOS",
        accountSignature: randomBytes(32).toString("base64"),
        platform: "android",
      },
      deviceId: randomBytes(16).toString("hex"),
      phoneId: randomBytes(16).toString("hex"),
      identityId: randomBytes(20).toString("base64"),
      registered: false,
      backupToken: randomBytes(20).toString("base64"),
      createdAt: Date.now(),
    };
  }

  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, { timestamp }] of this.cache) {
        if (now - timestamp > this.cacheTTL) {
          this.cache.delete(key);
        }
      }
    }, this.cacheTTL);
  }

  startWriteQueueProcessor() {
    setInterval(async () => {
      if (this.isWriting || this.writeQueue.length === 0) return;
      this.isWriting = true;
      const { data, id, resolve, reject } = this.writeQueue.shift();
      try {
        await this.performWrite(data, id);
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        this.isWriting = false;
      }
    }, 100);
  }

  async performWrite(data, id, attempt = 1) {
    const start = performance.now();
    try {
      const informationToStore = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
      const update = {
        $set: {
          ...informationToStore,
          updatedAt: new Date(),
        },
      };
      await this.collection.updateOne({ _id: id }, update, { upsert: true });
      this.cache.set(id, { data, timestamp: Date.now() });
      if (this.cache.size > this.cacheSize) {
        const oldestKey = [...this.cache.keys()].sort((a, b) => 
          this.cache.get(a).timestamp - this.cache.get(b).timestamp
        )[0];
        this.cache.delete(oldestKey);
      }
      this.emit('write', { id, duration: performance.now() - start });
    } catch (error) {
      if (attempt < this.retryAttempts) {
        this.logger.warn(`Retrying write for ${id}, attempt ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.performWrite(data, id, attempt + 1);
      }
      this.logger.error(`Failed to write data for ${id}:`, error);
      throw error;
    } finally {
      this.logger.debug(`writeData took ${performance.now() - start}ms`);
    }
  }

  async readData(id) {
    const start = performance.now();
    try {
      if (this.cache.has(id)) {
        this.emit('cacheHit', { id });
        return this.cache.get(id).data;
      }
      const data = await this.collection.findOne({ _id: id });
      if (!data) return null;
      const parsed = JSON.parse(JSON.stringify(data), BufferJSON.reviver);
      this.cache.set(id, { data: parsed, timestamp: Date.now() });
      this.emit('cacheMiss', { id });
      return parsed;
    } catch (error) {
      this.logger.error(`Failed to read data for ${id}:`, error);
      return null;
    } finally {
      this.logger.debug(`readData took ${performance.now() - start}ms`);
    }
  }

  async removeData(id) {
    const start = performance.now();
    try {
      await this.collection.deleteOne({ _id: id });
      this.cache.delete(id);
      this.emit('remove', { id });
    } catch (error) {
      this.logger.error(`Failed to remove data for ${id}:`, error);
    } finally {
      this.logger.debug(`removeData took ${performance.now() - start}ms`);
    }
  }

  async keys() {
    return {
      get: async (type, ids) => {
        const data = {};
        await Promise.all(
          ids.map(async (id) => {
            let value = await this.readData(`${type}-${id}`);
            if (type === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[id] = value;
          })
        );
        return data;
      },
      set: async (data) => {
        const tasks = [];
        for (const category of Object.keys(data)) {
          for (const id of Object.keys(data[category])) {
            const value = data[category][id];
            const key = `${category}-${id}`;
            tasks.push(
              new Promise((resolve, reject) => {
                this.writeQueue.push({
                  data: value,
                  id: key,
                  resolve,
                  reject
                });
              })
            );
          }
        }
        await Promise.all(tasks);
      },
    };
  }

  saveCreds() {
    return new Promise((resolve, reject) => {
      this.writeQueue.push({
        data: this.creds,
        id: "creds",
        resolve,
        reject
      });
    });
  }
}

const BufferJSON = {
  replacer: (k, value) => {
    if (Buffer.isBuffer(value) || value instanceof Uint8Array || value?.type === "Buffer") {
      return { type: "Buffer", data: Buffer.from(value?.data || value).toString("base64") };
    }
    if (value instanceof Map) {
      return { type: "Map", data: Array.from(value.entries()) };
    }
    if (value instanceof Set) {
      return { type: "Set", data: Array.from(value) };
    }
    if (typeof value === 'bigint') {
      return { type: "BigInt", data: value.toString() };
    }
    return value;
  },
  reviver: (_, value) => {
    if (typeof value === "object" && value !== null) {
      if (value.buffer === true || value.type === "Buffer") {
        return Buffer.from(value.data || value.value, "base64");
      }
      if (value.type === "Map") {
        return new Map(value.data);
      }
      if (value.type === "Set") {
        return new Set(value.data);
      }
      if (value.type === "BigInt") {
        return BigInt(value.data);
      }
    }
    return value;
  },
};

module.exports = async (collection, options = {}) => {
  const authState = new AdvancedMongoAuthState(collection, options);
  await authState.init();
  return {
    state: {
      creds: authState.creds,
      keys: await authState.keys(),
    },
    saveCreds: () => authState.saveCreds(),
  };
};