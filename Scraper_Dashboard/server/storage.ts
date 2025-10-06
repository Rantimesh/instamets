import { type User, type InsertUser, type ScraperConfig, type InstagramCredentials } from "@shared/schema";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getConfig(): Promise<ScraperConfig | undefined>;
  saveConfig(config: ScraperConfig): Promise<ScraperConfig>;
  getCredentials(): Promise<InstagramCredentials | undefined>;
  saveCredentials(credentials: InstagramCredentials): Promise<InstagramCredentials>;
}

export class FileStorage implements IStorage {
  private users: Map<string, User>;
  private configFile: string;
  private credentialsFile: string;

  constructor() {
    this.users = new Map();
    this.configFile = path.join(process.cwd(), 'data', 'config.json');
    this.credentialsFile = path.join(process.cwd(), 'data', 'credentials.json');
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConfig(): Promise<ScraperConfig | undefined> {
    try {
      const data = await fs.readFile(this.configFile, 'utf-8');
      return JSON.parse(data) as ScraperConfig;
    } catch (error) {
      return undefined;
    }
  }

  async saveConfig(config: ScraperConfig): Promise<ScraperConfig> {
    await fs.mkdir(path.dirname(this.configFile), { recursive: true });
    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
    return config;
  }

  async getCredentials(): Promise<InstagramCredentials | undefined> {
    try {
      const data = await fs.readFile(this.credentialsFile, 'utf-8');
      return JSON.parse(data) as InstagramCredentials;
    } catch (error) {
      return undefined;
    }
  }

  async saveCredentials(credentials: InstagramCredentials): Promise<InstagramCredentials> {
    await fs.mkdir(path.dirname(this.credentialsFile), { recursive: true });
    await fs.writeFile(this.credentialsFile, JSON.stringify(credentials, null, 2));
    return credentials;
  }
}

export const storage = new FileStorage();
