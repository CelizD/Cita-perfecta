export class BaseEntity {
  id: number;
  createdAt: string;

  constructor(id = Date.now(), createdAt = new Date().toISOString()) {
    this.id = id;
    this.createdAt = createdAt;
  }
}
