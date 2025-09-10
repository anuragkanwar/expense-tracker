import type {
  FriendshipResponse,
  FriendshipCreate,
  FriendshipUpdate,
} from "@/models/friendship";
import { BadRequestError } from "../errors/base-error";
import { ConnectionRepository } from "@/repositories/connection-repository";

export class ConnectionService {
  private readonly connectionRepository;

  constructor({
    connectionRepository,
  }: {
    connectionRepository: ConnectionRepository;
  }) {
    this.connectionRepository = connectionRepository;
  }

  async getAllConnections(
    limit: number = 10,
    offset: number = 0
  ): Promise<FriendshipResponse[]> {
    return this.connectionRepository.findAll(limit, offset);
  }

  async getConnectionById(id: string): Promise<FriendshipResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid connection ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid connection ID format");
    }

    return this.connectionRepository.findById(numericId);
  }

  async createConnection(data: FriendshipCreate): Promise<FriendshipResponse> {
    return this.connectionRepository.create(data);
  }

  async updateConnection(
    id: string,
    data: FriendshipUpdate
  ): Promise<FriendshipResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid connection ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid connection ID format");
    }

    const existingConnection =
      await this.connectionRepository.findById(numericId);
    if (!existingConnection) {
      return null;
    }

    return this.connectionRepository.update(numericId, data);
  }

  async deleteConnection(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid connection ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid connection ID format");
    }

    const existingConnection =
      await this.connectionRepository.findById(numericId);
    if (!existingConnection) {
      throw new BadRequestError("Connection not found");
    }

    return this.connectionRepository.delete(numericId);
  }
}
