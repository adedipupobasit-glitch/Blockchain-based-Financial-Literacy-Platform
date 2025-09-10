import { describe, it, expect, beforeEach } from "vitest";
import { stringAsciiCV, uintCV, bufferCV, listCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_TITLE = 101;
const ERR_INVALID_CONTENT_HASH = 102;
const ERR_INVALID_TOKEN_COST = 103;
const ERR_MODULE_ALREADY_EXISTS = 104;
const ERR_MODULE_NOT_FOUND = 105;
const ERR_PREREQUISITES_NOT_MET = 106;
const ERR_MAX_MODULES_EXCEEDED = 109;
const ERR_AUTHORITY_NOT_VERIFIED = 110;

interface Module {
  title: string;
  contentHash: Uint8Array;
  tokenCost: number;
  prerequisites: number[];
  difficulty: number;
  status: boolean;
  creator: string;
}

interface ModuleUnlocked { unlocked: boolean }
interface Result<T> { ok: boolean; value: T }

class ModuleManagerMock {
  state: {
    nextModuleId: number;
    maxModules: number;
    creationFee: number;
    authorityContract: string | null;
    modules: Map<number, Module>;
    modulesByTitle: Map<string, number>;
    moduleUnlocked: Map<string, ModuleUnlocked>;
  } = {
    nextModuleId: 0,
    maxModules: 1000,
    creationFee: 100,
    authorityContract: null,
    modules: new Map(),
    modulesByTitle: new Map(),
    moduleUnlocked: new Map(),
  };
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];
  tokenTransfers: Array<{ amount: number; from: string; to: string }> = [];

  reset() { this.state = { nextModuleId: 0, maxModules: 1000, creationFee: 100, authorityContract: null, modules: new Map(), modulesByTitle: new Map(), moduleUnlocked: new Map() }; this.caller = "ST1TEST"; this.stxTransfers = []; this.tokenTransfers = []; }
  setAuthorityContract(contractPrincipal: string): Result<boolean> { if (this.state.authorityContract !== null) return { ok: false, value: false }; this.state.authorityContract = contractPrincipal; return { ok: true, value: true }; }
  createModule(title: string, contentHash: Uint8Array, tokenCost: number, prerequisites: number[], difficulty: number): Result<number> {
    if (this.state.nextModuleId >= this.state.maxModules) return { ok: false, value: ERR_MAX_MODULES_EXCEEDED };
    if (!title || title.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (contentHash.length !== 32) return { ok: false, value: ERR_INVALID_CONTENT_HASH };
    if (tokenCost < 0) return { ok: false, value: ERR_INVALID_TOKEN_COST };
    if (prerequisites.length > 5) return { ok: false, value: ERR_PREREQUISITES_NOT_MET };
    if (difficulty < 1 || difficulty > 5) return { ok: false, value: ERR_INVALID_DIFFICULTY };
    if (this.state.modulesByTitle.has(title)) return { ok: false, value: ERR_MODULE_ALREADY_EXISTS };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    this.stxTransfers.push({ amount: this.state.creationFee, from: this.caller, to: this.state.authorityContract });
    const id = this.state.nextModuleId;
    this.state.modules.set(id, { title, contentHash, tokenCost, prerequisites, difficulty, status: true, creator: this.caller });
    this.state.modulesByTitle.set(title, id);
    this.state.nextModuleId++;
    return { ok: true, value: id };
  }
  getModule(id: number): Module | null { return this.state.modules.get(id) || null; }
  getModuleUnlocked(user: string, id: number): ModuleUnlocked | null { return this.state.moduleUnlocked.get(`${user}-${id}`) || null; }
  unlockModule(id: number): Result<boolean> {
    const module = this.state.modules.get(id);
    if (!module) return { ok: false, value: false };
    for (const prereq of module.prerequisites) { const unlocked = this.getModuleUnlocked(this.caller, prereq); if (!unlocked || !unlocked.unlocked) return { ok: false, value: false }; }
    if (module.tokenCost > 0) this.tokenTransfers.push({ amount: module.tokenCost, from: this.caller, to: "contract" });
    this.state.moduleUnlocked.set(`${this.caller}-${id}`, { unlocked: true });
    return { ok: true, value: true };
  }
  deactivateModule(id: number): Result<boolean> {
    const module = this.state.modules.get(id);
    if (!module) return { ok: false, value: false };
    if (module.creator !== this.caller) return { ok: false, value: false };
    this.state.modules.set(id, { ...module, status: false });
    return { ok: true, value: true };
  }
}

describe("ModuleManager", () => {
  let contract: ModuleManagerMock;

  beforeEach(() => { contract = new ModuleManagerMock(); contract.reset(); });

  it("creates a module successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const contentHash = new Uint8Array(32).fill(0);
    const result = contract.createModule("Basics", contentHash, 50, [], 1);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const module = contract.getModule(0);
    expect(module?.title).toBe("Basics");
    expect(module?.tokenCost).toBe(50);
    expect(module?.difficulty).toBe(1);
    expect(contract.stxTransfers).toEqual([{ amount: 100, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects duplicate module titles", () => {
    contract.setAuthorityContract("ST2TEST");
    const contentHash = new Uint8Array(32).fill(0);
    contract.createModule("Basics", contentHash, 50, [], 1);
    const result = contract.createModule("Basics", contentHash, 100, [0], 2);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MODULE_ALREADY_EXISTS);
  });

  it("unlocks module successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const contentHash = new Uint8Array(32).fill(0);
    contract.createModule("Module1", contentHash, 0, [], 1);
    const result = contract.unlockModule(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const unlocked = contract.getModuleUnlocked("ST1TEST", 0);
    expect(unlocked?.unlocked).toBe(true);
  });

  it("rejects unlock if prerequisites not met", () => {
    contract.setAuthorityContract("ST2TEST");
    const contentHash = new Uint8Array(32).fill(0);
    contract.createModule("Module1", contentHash, 0, [], 1);
    contract.createModule("Module2", contentHash, 0, [0], 2);
    const result = contract.unlockModule(1);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("deactivates module successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const contentHash = new Uint8Array(32).fill(0);
    contract.createModule("Module1", contentHash, 50, [], 1);
    const result = contract.deactivateModule(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const module = contract.getModule(0);
    expect(module?.status).toBe(false);
  });
});