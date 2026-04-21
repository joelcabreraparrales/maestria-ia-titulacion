export abstract class Server {
  protected abstract configServer(): void
  protected abstract configMiddlewares(): void
  protected abstract configRoutes(): void
  public abstract start(): void;
}
