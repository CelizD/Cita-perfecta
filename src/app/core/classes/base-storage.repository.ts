export class BaseStorageRepository<T extends { id: number }> {
  constructor(private readonly storageKey: string, private readonly seedData: T[] = []) {}

  protected readAll(): T[] {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      return JSON.parse(raw) as T[];
    }

    this.writeAll(this.seedData);
    return [...this.seedData];
  }

  protected readById(id: number): T | undefined {
    return this.readAll().find((item) => item.id === id);
  }

  protected createItem(item: Omit<T, 'id'>): T {
    const items = this.readAll();
    const created = { ...item, id: Date.now() } as T;
    this.writeAll([...items, created]);
    return created;
  }

  protected updateItem(id: number, changes: Partial<T>): T | undefined {
    let updatedItem: T | undefined;
    const updated = this.readAll().map((item) => {
      if (item.id !== id) return item;
      updatedItem = { ...item, ...changes, id };
      return updatedItem;
    });

    this.writeAll(updated);
    return updatedItem;
  }

  protected deleteItem(id: number): void {
    this.writeAll(this.readAll().filter((item) => item.id !== id));
  }

  protected writeAll(items: T[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}
