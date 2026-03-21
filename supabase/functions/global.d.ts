/** Только для IDE: встроенный TypeScript не подхватывает JSR и глобальный Deno. */
declare const Deno: {
  serve: (handler: (request: Request) => Response | Promise<Response>) => void
  env: {
    get(key: string): string | undefined
  }
}
