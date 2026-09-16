export interface DisposablePreviewResource {
  dispose: () => void;
}

export class PreviewResourceCache<T extends DisposablePreviewResource> {
  private readonly resources = new Map<string, T>();

  get size(): number {
    return this.resources.size;
  }

  getOrCreate(key: string, factory: () => T): T {
    const existing = this.resources.get(key);
    if (existing) return existing;
    const resource = factory();
    this.resources.set(key, resource);
    return resource;
  }

  disposeAll(): void {
    this.resources.forEach((resource) => resource.dispose());
    this.resources.clear();
  }
}

export function disposePreviewResources(resources: DisposablePreviewResource[]): void {
  resources.forEach((resource) => resource.dispose());
  resources.length = 0;
}
